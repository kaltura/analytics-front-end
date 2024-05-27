import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";

@Component({
  selector: 'app-event-mini-profile',
  templateUrl: './mini-profile.component.html',
  styleUrls: ['./mini-profile.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniProfileComponent')
  ]
})

export class MiniProfileComponent implements OnInit, OnDestroy {

  protected _componentId = 'event-mini-profile';

  public _isBusy = false;

  constructor() {
  }

  ngOnInit(): void {

  }

  public breakdown(): void {

  }

  ngOnDestroy(): void {
  }

}
