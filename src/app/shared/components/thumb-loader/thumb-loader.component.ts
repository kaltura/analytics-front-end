import {Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import { AuthService } from "shared/services";
import { AnalyticsPermissionsService } from "shared/analytics-permissions/analytics-permissions.service";
import { AnalyticsPermissions } from "shared/analytics-permissions/analytics-permissions";

@Component({
  selector: 'thumb-loader',
  templateUrl: './thumb-loader.component.html',
  styleUrls: ['./thumb-loader.component.scss']
})
export class ThumbLoaderComponent implements OnInit {
  @ViewChild('canvas') _canvas: any;
  @Input() thumbnailUrl: string = null;
  @Input() width = 86;
  @Input() height = 48;
  @Input() useBase64 = false;
  @Input() disabled = false;
  @Output() onErrror = new EventEmitter<string>();
  @Output() onClick = new EventEmitter();
  @Output() onMouseEnter = new EventEmitter<any>();
  @Output() onMouseLeave = new EventEmitter<any>();

  public _ks = '';
  public _loadThumbnailWithKs = false;
  public base64Data = '';

  constructor(_authService: AuthService,
              private _permissionsService: AnalyticsPermissionsService) {
    this._ks = _authService.ks;
    this._loadThumbnailWithKs = this._permissionsService.hasPermission(AnalyticsPermissions.FEATURE_LOAD_THUMBNAIL_WITH_KS);
  }

  ngOnInit(): void {
    if (this._loadThumbnailWithKs && this.thumbnailUrl !== null) {
      this.thumbnailUrl = this.thumbnailUrl.split('?')[0];
    }
  }

  public _onError(): void {
    this.onErrror.emit('error');
  }

  public _onClick(): void {
    if (!this.disabled) {
      this.onClick.emit();
    }
  }

  public _onMouseEnter(event): void {
    if (!this.disabled) {
      this.onMouseEnter.emit(event);
    }
  }

  public _onMouseLeave(event): void {
    if (!this.disabled) {
      this.onMouseLeave.emit(event);
    }
  }

  public onLoad(event): void {
    if (this.useBase64) {
      const ctx = this._canvas.nativeElement.getContext('2d');
      // get the scale
      var scale = Math.max(this._canvas.nativeElement.width / event.target.width, this._canvas.nativeElement.height / event.target.height);
      // get the top left position of the image
      var x = (this._canvas.nativeElement.width / 2) - (event.target.width / 2) * scale;
      var y = (this._canvas.nativeElement.height / 2) - (event.target.height / 2) * scale;
      ctx.drawImage(event.target, x, y, event.target.width * scale, event.target.height * scale);
      event.target.style.display = 'none';
      this.base64Data = this._canvas.nativeElement.toDataURL();
    }
  }

  public hideElement(event): void {
    if (event && event.currentTarget) {
      event.currentTarget.style.display = 'none';
    }
  }
}
