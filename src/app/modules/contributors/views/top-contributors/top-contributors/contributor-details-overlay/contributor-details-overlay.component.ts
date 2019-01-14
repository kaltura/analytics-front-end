import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaClient, KalturaMultiRequest, KalturaMultiResponse, KalturaUserRole } from 'kaltura-ngx-client';
import { Unsubscribable } from 'rxjs';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { map } from 'rxjs/operators';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { TranslateService } from '@ngx-translate/core';

export interface ContributorDetailsOverlayData {
  id: string;
  name: string;
  role: KalturaUserRole;
  email: string;
  creationDate: Date;
  lastUpload: Date;
}

@Component({
  selector: 'app-contributor-details-overlay',
  templateUrl: './contributor-details-overlay.component.html',
  styleUrls: ['./contributor-details-overlay.component.scss'],
})
export class ContributorDetailsOverlayComponent implements OnInit, OnDestroy {
  @Input() userId: string;
  
  private _requestSubscription: Unsubscribable;
  public _data: ContributorDetailsOverlayData;
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
  
    this._data = {
      id: 'test',
      name: 'John Doe',
      role: new KalturaUserRole({ name: 'test' }),
      email: 'test@test.com',
      creationDate: new Date(),
      lastUpload: new Date()
    };
    
    const request = new KalturaMultiRequest(
    );
    
    this._requestSubscription = this._kalturaClient
      .multiRequest(request)
      .pipe(
        cancelOnDestroy(this),
        map((responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            throw Error(this._translate.instant('app.contributors.topContributorsReport.errorLoadingUser'));
          }
          
          // TBD
          
          return {
            id: 'test',
            name: 'John Doe',
            role: new KalturaUserRole({name: 'test'}),
            email: 'test@test.com',
            creationDate: new Date(),
            lastUpload: new Date()
          };
        })
      )
      .subscribe(
        (data: ContributorDetailsOverlayData) => {
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
