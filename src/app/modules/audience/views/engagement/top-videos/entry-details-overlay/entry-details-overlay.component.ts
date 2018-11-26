import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { BaseEntryGetAction, KalturaClient, KalturaEntryType, KalturaMediaEntry, KalturaMultiRequest, KalturaMultiResponse, KalturaRequestOptions, KalturaUser, UserGetAction } from 'kaltura-ngx-client';
import { Unsubscribable } from 'rxjs';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { map } from 'rxjs/operators';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';

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
  
  constructor(private _kalturaClient: KalturaClient) {
  
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
      new BaseEntryGetAction({ entryId: this.entryId }),
      new UserGetAction({ userId: null })
        .setRequestOptions(new KalturaRequestOptions({}).setDependency(['userId', 0, 'userId']))
    );
    
    this._requestSubscription = this._kalturaClient
      .multiRequest(request)
      .pipe(
        cancelOnDestroy(this),
        map((responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            throw Error('Cannot load entry data');
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
            title: 'Error',
            message: error.message,
            buttons: []
          });
        });
  }
  
  ngOnDestroy(): void {
  
  }
}
