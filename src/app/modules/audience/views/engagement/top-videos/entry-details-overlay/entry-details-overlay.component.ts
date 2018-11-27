import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BaseEntryGetAction, KalturaClient, KalturaDetachedResponseProfile, KalturaEntryType, KalturaMediaEntry, KalturaMultiRequest, KalturaMultiResponse, KalturaRequestOptions, KalturaResponseProfileType, KalturaUser, UserGetAction } from 'kaltura-ngx-client';
import { Unsubscribable } from 'rxjs';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { map } from 'rxjs/operators';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { TranslateService } from '@ngx-translate/core';

export interface EntryDetailsOverlayData {
  name: string;
  type: KalturaEntryType;
  creator: string;
  creationDate: Date;
  duration: number;
  thumbnailUrl: string;
}

@Component({
  selector: 'app-entry-details-overlay',
  templateUrl: './entry-details-overlay.component.html',
  styleUrls: ['./entry-details-overlay.component.scss'],
})
export class EntryDetailsOverlayComponent implements OnInit, OnDestroy {
  @Input() entryId: string;
  
  private _requestSubscription: Unsubscribable;
  private _partnerId = analyticsConfig.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  
  public _data: EntryDetailsOverlayData;
  public _loading = false;
  public _errorMessage: AreaBlockerMessage;
  
  constructor(private _kalturaClient: KalturaClient,
              private _translate: TranslateService) {
    
  }
  
  ngOnInit(): void {
    if (!this.entryId) {
      return;
    }
    
    this._loading = true;
    
    if (this._requestSubscription) {
      this._requestSubscription.unsubscribe();
      this._requestSubscription = null;
    }
    
    const request = new KalturaMultiRequest(
      new BaseEntryGetAction({ entryId: this.entryId })
        .setRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
            type: KalturaResponseProfileType.includeFields,
            fields: 'id,name,type,createdAt,msDuration'
          })
        }),
      new UserGetAction({ userId: null })
        .setRequestOptions(
          new KalturaRequestOptions({
            responseProfile: new KalturaDetachedResponseProfile({
              type: KalturaResponseProfileType.includeFields,
              fields: 'id,fullName'
            })
          }).setDependency(['userId', 0, 'userId'])
        )
    );
    
    this._requestSubscription = this._kalturaClient
      .multiRequest(request)
      .pipe(
        cancelOnDestroy(this),
        map((responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            throw Error(this._translate.instant('app.engagement.topVideosReport.errorLoadingEntry'));
          }
          
          const entry = responses[0].result as KalturaMediaEntry;
          const user = responses[1].result as KalturaUser;
          
          return {
            name: entry.name,
            type: entry.type,
            creator: user.fullName,
            creationDate: entry.createdAt,
            duration: entry.msDuration,
            thumbnailUrl: `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${entry.id}/width/280/height/100?rnd=${Math.random()}`
          };
        })
      )
      .subscribe(
        (data: EntryDetailsOverlayData) => {
          this._loading = false;
          this._data = data;
        },
        error => {
          this._loading = false;
          this._errorMessage = new AreaBlockerMessage({
            title: this._translate.instant('app.common.error'),
            message: error.message,
            buttons: []
          });
        });
  }
  
  ngOnDestroy(): void {
  
  }
}
