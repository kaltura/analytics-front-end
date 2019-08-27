import { Component, Input } from '@angular/core';
import { KalturaMediaEntry } from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { AuthService } from 'shared/services';

@Component({
  selector: 'app-image-entry-preview',
  templateUrl: './entry-preview.component.html',
  styleUrls: ['./entry-preview.component.scss'],
})
export class ImageEntryPreviewComponent {
  @Input() set entry(value: KalturaMediaEntry) {
    if (value) {
      this._imgUrl = `${this._apiUrl}/p/${this._partnerId}/sp/${this._partnerId}00/thumbnail/entry_id/${value.id}/width/288/height/161`;
    }
  }
  
  private _partnerId = this._authService.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;
  
  public _imgUrl: string;
  
  constructor(private _authService: AuthService) {
  }
}


