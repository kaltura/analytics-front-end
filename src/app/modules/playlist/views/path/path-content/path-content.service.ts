import {Injectable, OnDestroy} from '@angular/core';
import {Observable} from "rxjs";
import {
  FileAssetListAction, FileAssetServeAction, InteractivityGetAction, KalturaClient, KalturaFileAsset,
  KalturaFileAssetFilter,
  KalturaFileAssetListResponse,
  KalturaFileAssetObjectType, KalturaInteractivity
} from "kaltura-ngx-client";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";
import {map, switchMap} from "rxjs/operators";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {analyticsConfig} from "configuration/analytics-config";
import {AuthService} from "shared/services";
import {HttpClient} from "@angular/common/http";
import {TranslateService} from "@ngx-translate/core";

export interface Node {
  id?: string;
  isHome?: boolean;
  level?: number;
  entryId?: string;
  name?: string;
  thumbnailUrl?: string;
  plays?: number;
  viewers?: number;
  completionRate?: number;
  prefetchNodeIds?: string[];
  deleted?: boolean;
  deletedDate?: string;
  hotspots?: HotSpot[];
}

export interface HotSpot {
  id?: string;
  destinationId?: string;
  destination?: string;
  name?: string;
  behavior?: string;
  hyperlinkUrl?: string;
  hotspot_clicked?: number;
  type?: 'nodeSwitch' | 'hyperlink' | 'pause' | 'none';
}

@Injectable()
export class PathContentService implements  OnDestroy {

  constructor(private _translate: TranslateService,
              private http: HttpClient,
              private _kalturaClient: KalturaClient,
              private _authService: AuthService) {
  }

  public loadIVData(playlistId): Observable<Node[]> {
    const fileAssetsListFilter: KalturaFileAssetFilter = new KalturaFileAssetFilter();
    fileAssetsListFilter.fileAssetObjectTypeEqual = KalturaFileAssetObjectType.entry;
    fileAssetsListFilter.objectIdEqual = playlistId;
    const fileAssetsListAction = new FileAssetListAction({filter: fileAssetsListFilter});
    return this._kalturaClient.request(fileAssetsListAction)
      .pipe(cancelOnDestroy(this))
      .pipe(switchMap((response: KalturaFileAssetListResponse) => {
        let jsonFileAssetId = 0;
        let projectFileAssetId = 0;
        response.objects.forEach((fileAsset: KalturaFileAsset) => {
          if (fileAsset.name === "GRAPH_DATA") {
            jsonFileAssetId = fileAsset.id;
          }
          if (fileAsset.name === "PROJECT_DATA") {
            projectFileAssetId = fileAsset.id;
          }
        });
        const fileAssetsServeAction = new FileAssetServeAction({id: jsonFileAssetId});
        const projectAssetsServeAction = new FileAssetServeAction({id: projectFileAssetId});
        return Observable.forkJoin(this._kalturaClient.request(fileAssetsServeAction), this._kalturaClient.request(projectAssetsServeAction));
      }))
      .pipe(switchMap(responses => {
        return Observable.forkJoin(this.http.get(`${responses[0].url}&rnd=${Math.random()}`), this.http.get(`${responses[1].url}&rnd=${Math.random()}`));
      }))
      .pipe(map(dataArray => {
        return this.parseIVData(dataArray[0], dataArray[1]).concat(this.parseIVDeletedNodes(dataArray[1]));
      }));
  }

  public loadPathData(playlistId): Observable<Node[]> {
    return this._kalturaClient.request(new InteractivityGetAction({entryId: playlistId}))
      .pipe(cancelOnDestroy(this))
      .pipe(map((result: KalturaInteractivity) => {
        return this.parsePathData(result.data);
      }));
  }

  private parsePathData(pathData: string): Node[] {
    const data = JSON.parse(pathData);
    let nodes: Node[] = [];   // the returned nodes array
    let currentLevel = 1;     // initial level. We use this variable to increment the level for each pass on the nodes array
    let nextLevelNodes = [];  // array holding all the found next level nodes to be scanned for
    let levelsNodeFound = 0;  // counter used to check if all node levels were found
    const startNodeId = data.pathData && data.pathData.startNodeId ? data.pathData.startNodeId : '';  // get the start node ID from the JSON data. Used to mark the start node in the table (home icon)

    if (data.nodes) {
      // first run on all nodes to find the start node. We also use this run to create all the IV nodes array, setting the level only to the start node (level = 0)
      data.nodes.forEach(node => {
        const newNode: Node = {
          id: node.id,
          isHome: node.id === startNodeId,
          name: node.name,
          entryId: node.entryId,
          prefetchNodeIds: [],
          hotspots: []
        };
        // add hotspots
        if (node.interactions) {
          node.interactions.forEach(interaction => {
            if (interaction.pathData && interaction.pathData.preBuffer && interaction.pathData.preBuffer.length) {
              interaction.pathData.preBuffer.forEach(preBuffer => {
                newNode.prefetchNodeIds.push(preBuffer.nodeId);
              });
            }
            const supportedInteractionTypes = ["GoToNode", "GoToUrl", "Pause"];
            if (interaction.data && interaction.data.behavior && supportedInteractionTypes.indexOf(interaction.data.behavior.type) !== -1 ) {
              let newHotspot: HotSpot = {
                id: interaction.id,
                name: interaction.data.text ? interaction.data.text.label : '',
                type: 'none'
              };
              switch (interaction.data.behavior.type) {
                case "GoToNode":
                  newHotspot.type = 'nodeSwitch';
                  data.nodes.forEach(node => {
                    if (node.id === interaction.data.behavior.nodeId) {
                      newHotspot.destination = node.name;
                    }
                  });
                  break;
                case "GoToUrl":
                  newHotspot.type = 'hyperlink';
                  newHotspot.destination = interaction.data.behavior.url;
                  break;
                case "Pause":
                  newHotspot.type = 'pause';
                  newHotspot.destination = '';
                  break;
              }
              // add hotspot properties from metadata json
              newNode.hotspots.push(newHotspot);
            }
          });
        }
        if (node.id === startNodeId) {
          newNode.level = currentLevel; // set level 0
          levelsNodeFound++;            // increment found nodes with levels counter
          nextLevelNodes = [...nextLevelNodes, ...new Set(newNode.prefetchNodeIds)]; // set the array to scan next with the found node children nodes
        }
        nodes.push(newNode); // save the found node with level to the returned nodes array
      });
      // continue searching for node levels until all nodes are set with levels
      while (levelsNodeFound < nodes.length) {
        currentLevel++;    // increment level
        // prevent infinite loop in case of un-attached nodes or corrupted data
        if (currentLevel > nodes.length) {
          console.warn("Not all node levels were found. Could be un-attached nodes or corrupted data.");
          break;
        }
        let newNodes = []; // array holding the nodes that will be found in this pass
        // scan the nextLevelNodes array and set the level to its nodes
        nextLevelNodes.forEach(nodeId => {
          nodes.forEach(node => {
            // since the same node can be accessed in more than 1 level, we first check the the level wasn't set yet. This ensures we set the minimal level value (shortest IV route to this node)
            if (node.id === nodeId && typeof node.level === "undefined") {
              node.level = currentLevel;   // set node level to the current level
              levelsNodeFound++;           // increment found nodes with levels counter
              newNodes = [...newNodes, ...node.prefetchNodeIds]; // append this node children to the nodes that will be scanned in the next pass
            }
          });
        });
        // since nodes can be access more than once, we might get the same node few times in the array. The following code removes duplicated nodes from the nextLevelNodes array
        nextLevelNodes = newNodes.filter(function(item, pos, self) {
          return self.indexOf(item) === pos;
        });
      }
      return nodes; // return the found nodes with levels
    } else {
      return [];    // if no nodes were found - return an empty array
    }
    return [];
  }

  private parseIVData(data, metadata): Node[] {
    let nodes: Node[] = [];   // the returned nodes array
    let currentLevel = 1;     // initial level. We use this variable to increment the level for each pass on the nodes array
    let nextLevelNodes = [];  // array holding all the found next level nodes to be scanned for
    let levelsNodeFound = 0;  // counter used to check if all node levels were found
    const startNodeId = data.settings && data.settings.startNodeId ? data.settings.startNodeId : '';  // get the start node ID from the JSON data. Used to mark the start node in the table (home icon)
    if (data.nodes) {
      // first run on all nodes to find the start node. We also use this run to create all the IV nodes array, setting the level only to the start node (level = 0)
      data.nodes.forEach(node => {
        const newNode: Node = {
          id: node.id,
          isHome: node.id === startNodeId,
          name: node.name,
          entryId: node.entryId,
          prefetchNodeIds: node.prefetchNodeIds,
          hotspots: []
        };
        if (node.id === startNodeId) {
          newNode.level = currentLevel; // set level 0
          levelsNodeFound++;            // increment found nodes with levels counter
          nextLevelNodes = [...nextLevelNodes, ...new Set(node.prefetchNodeIds)]; // set the array to scan next with the found node children nodes
        }
        // add hotspots
        if (data.hotspots) {
          data.hotspots.forEach(hotspot => {
            if (hotspot.nodeId === node.id) {
              let newHotspot: HotSpot = {
                id: hotspot.id,
                name: hotspot.name ? hotspot.name : '',
                type: 'none'
              };
              // add hotspot properties from metadata json
              if (metadata.hotspots) {
                metadata.hotspots.forEach(metadataHotspot => {
                  if (metadataHotspot.id === hotspot.id) {
                    if (metadataHotspot.behavior === "instant_jump" && metadataHotspot.destinationId) {
                      newHotspot.type = 'nodeSwitch';
                      // use the destinationId to find the destination node and set its name to the destination property
                      data.nodes.forEach(node => {
                        if (node.id === metadataHotspot.destinationId) {
                          newHotspot.destination = node.name;
                        }
                      });
                    }
                    if (metadataHotspot.behavior === "non_clickable" && metadataHotspot.hyperlinkUrl) {
                      newHotspot.destination = metadataHotspot.hyperlinkUrl;
                      newHotspot.type = 'hyperlink';
                    }
                    if (metadataHotspot.behavior === "pause_video") {
                      newHotspot.destination = metadataHotspot.hyperlinkUrl ? metadataHotspot.hyperlinkUrl : '';
                      newHotspot.type = 'pause';
                    }
                  }
                });
              }
              newNode.hotspots.push(newHotspot);
            }
          });
        }
        nodes.push(newNode); // save the found node with level to the returned nodes array
      });
      // continue searching for node levels until all nodes are set with levels
      while (levelsNodeFound < nodes.length) {
        currentLevel++;    // increment level
        // prevent infinite loop in case of un-attached nodes or corrupted data
        if (currentLevel > nodes.length) {
          console.warn("Not all node levels were found. Could be un-attached nodes or corrupted data.");
          break;
        }
        let newNodes = []; // array holding the nodes that will be found in this pass
        // scan the nextLevelNodes array and set the level to its nodes
        nextLevelNodes.forEach(nodeId => {
          nodes.forEach(node => {
            // since the same node can be accessed in more than 1 level, we first check the the level wasn't set yet. This ensures we set the minimal level value (shortest IV route to this node)
            if (node.id === nodeId && typeof node.level === "undefined") {
              node.level = currentLevel;   // set node level to the current level
              levelsNodeFound++;           // increment found nodes with levels counter
              newNodes = [...newNodes, ...node.prefetchNodeIds]; // append this node children to the nodes that will be scanned in the next pass
            }
          });
        });
        // since nodes can be access more than once, we might get the same node few times in the array. The following code removes duplicated nodes from the nextLevelNodes array
        nextLevelNodes = newNodes.filter(function(item, pos, self) {
          return self.indexOf(item) === pos;
        });
      }
      return nodes; // return the found nodes with levels
    } else {
      return [];    // if no nodes were found - return an empty array
    }
  }

  private parseIVDeletedNodes(data): Node[] {
    let nodes: Node[] = [];   // the returned nodes array
    if (data.deletedNodes) {
      data.deletedNodes.forEach(node => {
        const newNode: Node = {
          id: node.id,
          name: node.name,
          deleted: true,
          entryId: node.entry_id,
          deletedDate: node.delete_date ? this._translate.instant('app.playlist.deletionDate') + ' ' + DateFilterUtils.formatFullDateString(node.delete_date) : ''
        };
        nodes.push(newNode);
      });
    }
    return nodes;
  }

  ngOnDestroy(): void {
  }
}
