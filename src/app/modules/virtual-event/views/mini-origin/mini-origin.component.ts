import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import {BehaviorSubject} from "rxjs";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";

@Component({
  selector: 'app-ve-mini-origin',
  templateUrl: './mini-origin.component.html',
  styleUrls: ['./mini-origin.component.scss'],
  providers: [
    KalturaLogger.createLogger('VEMiniOriginComponent')
  ]
})
export class VEMiniOriginComponent implements OnInit, OnDestroy{

  protected _componentId = 've-mini-insights';

  @Input() unregistered = 0;
  @Input() attendees$: BehaviorSubject<{ results: any[], sum: number }> = new BehaviorSubject({ results: [], sum: 0 });

  public countries = [];
  public countriesCount = 0;

  constructor() {
  }

  ngOnInit(): void {
    if (this.attendees$) {
      this.attendees$
        .pipe(cancelOnDestroy(this))
        .subscribe(({ results, sum }) => {

        });
    }
  }

  ngOnDestroy(): void {
  }

}
