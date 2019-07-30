import { Component, Input } from '@angular/core';
import { KalturaMediaEntry } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';

@Component({
  selector: 'app-image-entry-preview',
  templateUrl: './entry-preview.component.html',
  styleUrls: ['./entry-preview.component.scss'],
})
export class ImageEntryPreviewComponent {
  @Input() set entry(value: KalturaMediaEntry) {
    if (value) {
      this._imgAlt = value.name;
      this._imgUrl = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${value.id}/width/864/height/480?rnd=${Math.random()}`;
    }
  }
  
  private _partnerId = analyticsConfig.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  
  public _imgUrl: string;
  public _imgAlt: string;
  
  constructor() {
  }
}


