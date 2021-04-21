import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaClient, KalturaDetachedResponseProfile, KalturaResponseProfileType, KalturaUser, UserGetAction } from 'kaltura-ngx-client';
import { Unsubscribable } from 'rxjs';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-reactions-breakdown-overlay',
  templateUrl: './reactions-breakdown-overlay.component.html',
  styleUrls: ['./reactions-breakdown-overlay.component.scss'],
})
export class ReactionsBreakdownOverlayComponent implements OnInit, OnDestroy {
  // @Input() userId: string;

  private _requestSubscription: Unsubscribable;
  public _data: KalturaUser;
  public _loading = false;
  public _errorMessage: string;

  constructor(private _kalturaClient: KalturaClient,
              private _translate: TranslateService) {

  }

  ngOnInit(): void {
    /*
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
          this._errorMessage = error.message;
        });*/
  }

  ngOnDestroy(): void {

  }
}
