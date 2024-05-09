import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { cancelOnDestroy } from "@kaltura-ng/kaltura-common";

@Component({
  selector: 'app-event-mini-scoring',
  templateUrl: './mini-scoring.component.html',
  styleUrls: ['./mini-scoring.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniScoringComponent')
  ]
})

export class MiniScoringComponent implements OnInit, OnDestroy {

  protected _componentId = 'event-mini-scoring';

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
