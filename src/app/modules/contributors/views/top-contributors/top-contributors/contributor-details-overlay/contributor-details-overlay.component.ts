import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaClient, KalturaDetachedResponseProfile, KalturaMultiRequest, KalturaMultiResponse, KalturaResponseProfileType, KalturaUser, KalturaUserRole, UserGetAction } from 'kaltura-ngx-client';
import { Unsubscribable } from 'rxjs';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { map } from 'rxjs/operators';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-contributor-details-overlay',
  templateUrl: './contributor-details-overlay.component.html',
  styleUrls: ['./contributor-details-overlay.component.scss'],
})
export class ContributorDetailsOverlayComponent implements OnInit, OnDestroy {
  @Input() userId: string;
  
  private _requestSubscription: Unsubscribable;
  public _data: KalturaUser;
  public _loading = false;
  public _errorMessage: AreaBlockerMessage;
  
  constructor(private _kalturaClient: KalturaClient,
              private _translate: TranslateService) {
    
  }
  
  ngOnInit(): void {
    if (!this.userId) {
      return;
    }
    
    this._loading = true;
    
    if (this._requestSubscription) {
      this._requestSubscription.unsubscribe();
      this._requestSubscription = null;
    }
  
    const action = new UserGetAction({ userId: this.userId }).setRequestOptions({
      responseProfile: new KalturaDetachedResponseProfile({
        type: KalturaResponseProfileType.includeFields,
        fields: 'id,name,fullName,createdAt,roleNames,email'
      })
    });
    this._requestSubscription = this._kalturaClient
      .request(action)
      .pipe(cancelOnDestroy(this))
      .subscribe(
        (data: KalturaUser) => {
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
