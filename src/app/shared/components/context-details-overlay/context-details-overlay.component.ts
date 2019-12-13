import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CategoryGetAction, KalturaCategory, KalturaClient, KalturaDetachedResponseProfile, KalturaResponseProfileType } from 'kaltura-ngx-client';
import { Unsubscribable } from 'rxjs';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-context-details-overlay',
  templateUrl: './context-details-overlay.component.html',
  styleUrls: ['./context-details-overlay.component.scss'],
})
export class ContextDetailsOverlayComponent implements OnInit, OnDestroy {
  @Input() contextId: number;
  
  private _requestSubscription: Unsubscribable;
  public _data: KalturaCategory;
  public _loading = false;
  public _errorMessage: string;
  
  constructor(private _kalturaClient: KalturaClient,
              private _translate: TranslateService) {
    
  }
  
  ngOnInit(): void {
    if (!this.contextId) {
      return;
    }
    
    this._loading = true;
    
    if (this._requestSubscription) {
      this._requestSubscription.unsubscribe();
      this._requestSubscription = null;
    }
    
    const action = new CategoryGetAction({ id: this.contextId })
    .setRequestOptions({
      responseProfile: new KalturaDetachedResponseProfile({
        type: KalturaResponseProfileType.includeFields,
        fields: 'id,fullName,owner'
      })
    });
    this._requestSubscription = this._kalturaClient
      .request(action)
      .pipe(cancelOnDestroy(this))
      .subscribe(
        (data: KalturaCategory) => {
          this._loading = false;
          this._data = data;
        },
        error => {
          this._loading = false;
          this._errorMessage = error.message;
        });
  }
  
  ngOnDestroy(): void {
  
  }
}
