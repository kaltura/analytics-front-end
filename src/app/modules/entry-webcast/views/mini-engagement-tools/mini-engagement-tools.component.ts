import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  CuePointListAction,
  KalturaAnnotationFilter,
  KalturaClient,
  KalturaCuePointType,
  KalturaCuePointListResponse,
  KalturaFilterPager,
  KalturaNullableBoolean,
  KalturaAnnotation,
  KalturaMultiResponse,
  KalturaAPIException,
  KalturaThumbCuePointFilter,
  KalturaCodeCuePointFilter,
  KalturaCodeCuePoint,
  KalturaDetachedResponseProfile,
  KalturaMetadataFilter,
  KalturaMetadataObjectType,
  KalturaResponseProfileMapping,
  KalturaResponseProfileType,
} from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, BrowserService, ErrorsManagerService } from 'shared/services';
import { TranslateService } from '@ngx-translate/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { analyticsConfig } from "configuration/analytics-config";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";

@Component({
  selector: 'app-webcast-mini-engagement-tools',
  templateUrl: './mini-engagement-tools.component.html',
  styleUrls: ['./mini-engagement-tools.component.scss'],
  providers: [
    KalturaLogger.createLogger('WebcastMiniEngagementToolsComponent')
  ]
})

export class WebcastMiniEngagementToolsComponent implements OnDestroy, OnInit {

  @Input() entryId = '';

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;

  public _slides = 0;
  public _polls = 0;
  public _announcements = 0;
  public _answer_on_air = 0;

  constructor(private _translate: TranslateService,
              private _kalturaClient: KalturaClient,
              private _browserService: BrowserService,
              private _authService: AuthService,
              private _errorsManager: ErrorsManagerService,
              private _logger: KalturaLogger) {
  }

  ngOnInit(): void {
    this._isBusy = true;
    this._kalturaClient
      .multiRequest([
        this.getEntryCuePoints(),
        this.getSlides(),
        this.getPolls()
      ])
      .pipe(cancelOnDestroy(this))
      .subscribe(
        (responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            const err: KalturaAPIException = responses.getFirstError();
            throw err;
          }
          this._parseCuePointsResponse(responses[0].result as KalturaCuePointListResponse);
          this._slides = (responses[1].result as KalturaCuePointListResponse).totalCount;
          this._parsePolls(responses[2].result as KalturaCuePointListResponse);
          this._isBusy = false;
        },
        error => {
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            }
          };
          this._isBusy = false;
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  ngOnDestroy(): void {
  }

  private getEntryCuePoints(): CuePointListAction {

    const filter: KalturaAnnotationFilter = new KalturaAnnotationFilter({
      cuePointTypeEqual: KalturaCuePointType.annotation,
      tagsLike: 'qna',
      entryIdEqual: this.entryId,
      orderBy: '+createdAt',
      isPublicEqual: KalturaNullableBoolean.trueValue
    });

    const pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 500, pageIndex: 1});

    return new CuePointListAction({ filter, pager })
      .setRequestOptions(
        {
          responseProfile: this.getResponseProfile()
        }
      )
  }

  private getResponseProfile(): KalturaDetachedResponseProfile {
    //metadata filter
    const metadataFilter = new KalturaMetadataFilter({
      metadataObjectTypeEqual: KalturaMetadataObjectType.annotation
    });
    //metadata filter mapping
    const metadataFilterMapping = new KalturaResponseProfileMapping({
      filterProperty: 'objectIdEqual',
      parentProperty: 'id'
    });
    //detached metadata response profile
    const metadataResponseProfile = new KalturaDetachedResponseProfile({
      name: 'analytics_qna_drp',
      type: KalturaResponseProfileType.includeFields,
      fields: 'id,xml',
      filter: metadataFilter,
      mappings: [metadataFilterMapping]
    });
    //cue point response profile
    const cuepointResponseProfile = new KalturaDetachedResponseProfile({
      name: 'analytics_webcast_cp',
      type: KalturaResponseProfileType.includeFields,
      fields: 'id,createdAt,updatedAt,text,userId',
      relatedProfiles: [metadataResponseProfile]
    });
    return cuepointResponseProfile;
  }

  private getSlides(): CuePointListAction {
    const filter: KalturaThumbCuePointFilter = new KalturaThumbCuePointFilter({
      cuePointTypeEqual: KalturaCuePointType.thumb,
      entryIdEqual: this.entryId
    });
    const pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 500, pageIndex: 1});
    return new CuePointListAction({ filter, pager });
  }

  private getPolls(): CuePointListAction {
    const filter: KalturaCodeCuePointFilter = new KalturaCodeCuePointFilter({
      cuePointTypeEqual: KalturaCuePointType.code,
      tagsLike: 'poll-data',
      entryIdEqual: this.entryId
    });
    const pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 500, pageIndex: 1});
    return new CuePointListAction({ filter, pager });
  }

  private _parseCuePointsResponse(data: KalturaCuePointListResponse): void {
    if (data.objects) {
      const parser = new DOMParser();
      data.objects.forEach((cuePoint: KalturaAnnotation) => {
        if (cuePoint.relatedObjects && cuePoint.relatedObjects.analytics_qna_drp) {
          if (cuePoint.relatedObjects.analytics_qna_drp['objects'] && cuePoint.relatedObjects.analytics_qna_drp['objects'][0] && cuePoint.relatedObjects.analytics_qna_drp['objects'][0]['xml'] ){
            const xml = cuePoint.relatedObjects.analytics_qna_drp['objects'][0]['xml'];
            const xmlDoc = parser.parseFromString(xml,"text/xml");
            const type = xmlDoc.getElementsByTagName("Type")[0].childNodes[0].nodeValue;
            if (type === "Announcement") {
              this._announcements++;
            }
            if (type === "AnswerOnAir") {
              this._answer_on_air++;
            }
          }
        }
      });
    }
  }

  private _parsePolls(data: KalturaCuePointListResponse): void {
    let pollsCount = 0;
    if (data.objects) {
      data.objects.forEach((cuePoint: KalturaCodeCuePoint) => {
        if (cuePoint.partnerData) {
          const partnerData = JSON.parse(cuePoint.partnerData);
          if (partnerData.text && (partnerData.text.question || partnerData.text.answers)) {
            pollsCount++;
          }
        }
      })
    }
    this._polls = pollsCount;
  }

  public export(): void {
    this._browserService.exportToCsv(`${this._authService.pid}-Report_export-${this.entryId.split(analyticsConfig.valueSeparator)[0]}.csv`,[
      ["# ------------------------------------"],
      ["Report: Engagement Tools"],
      ["Slides", "Polls", "Announcements", "Answer On Air"],
      [this._slides, this._polls, this._announcements, this._answer_on_air ],
      ["# ------------------------------------"],
    ]);
  }

}
