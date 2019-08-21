import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthService } from "shared/services";

@Component({
  selector: 'app-thumbnail-loader',
  templateUrl: './thumbnail-loader.component.html',
  styleUrls: ['./thumbnail-loader.component.scss']
})
export class ThumbnailLoaderComponent {
  
  @Input() thumbnailUrl: string = null;
  @Output() onerrror = new EventEmitter<string>();

  public _ks = '';

  constructor(_authService: AuthService) {
    this._ks = _authService.ks;
  }
  
  public _onError(): void {
    this.onerrror.emit('error');
  }
}
