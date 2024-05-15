import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";

@Component({
  selector: 'app-event-mini-top-moment',
  templateUrl: './mini-top-moment.component.html',
  styleUrls: ['./mini-top-moment.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniTopMomentComponent')
  ]
})

export class MiniTopMomentComponent implements OnInit, OnDestroy {

  protected _componentId = 'event-mini-top-moment';

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
