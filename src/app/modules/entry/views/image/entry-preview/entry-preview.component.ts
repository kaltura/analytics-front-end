import {Component, Input, ViewChild} from '@angular/core';
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
  @ViewChild('holder') iconHolder: any;
  @ViewChild('thumbks') thumbks: any;

  private _partnerId = this._authService.pid;
  private _apiUrl = analyticsConfig.kalturaServer.uri.startsWith('http')
    ? analyticsConfig.kalturaServer.uri
    : `${location.protocol}//${analyticsConfig.kalturaServer.uri}`;

  public _imgUrl: string;
  public _ks = this._authService.ks;

  constructor(private _authService: AuthService) {
  }

  public onFirstLoadError(event): void {
    event.stopImmediatePropagation();
    this.thumbks.nativeElement.src = this._imgUrl + '/ks/' + this._ks;
    event.currentTarget.style.display = 'none';
  }

  public onIconLoadError(event): void {
    event.stopImmediatePropagation();
    event.currentTarget.style.display = 'none';
    if (this.iconHolder) {
      this.iconHolder.nativeElement.classList.add('kIconfile-small');
    }
  }
}


