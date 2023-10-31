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
  @Input() topCountries$: BehaviorSubject<{ topCountries: any[], totalCount: number }> = new BehaviorSubject({ topCountries: [], totalCount: 0 });

  public countries = [];
  public countriesCount = 0;

  constructor() {
  }

  ngOnInit(): void {
    if (this.topCountries$) {
      this.topCountries$
        .pipe(cancelOnDestroy(this))
        .subscribe(({ topCountries, totalCount }) => {
          this.countriesCount = totalCount;
          this.countries = [];
          if (topCountries.length > 0) {
            this.countries.push(topCountries[0].object_id);
          }
          if (topCountries.length > 1) {
            this.countries.push(topCountries[1].object_id);
          }
        });
    }
  }

  ngOnDestroy(): void {
  }

}
