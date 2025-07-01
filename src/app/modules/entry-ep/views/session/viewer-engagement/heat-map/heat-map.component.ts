import { Component, ElementRef, HostListener, Input, NgZone, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { HeatMapPoints, HeatMapStoreService } from './heat-map-store.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TranslateService } from '@ngx-translate/core';
import { ReportHelper } from 'shared/services';
import { KalturaEndUserReportInputFilter } from 'kaltura-ngx-client';

export interface HeatMapItem {
  color: string;
  width: string;
  left: string;
  tooltip: string;
}

@Component({
  selector: 'ep-heat-map',
  templateUrl: './heat-map.component.html',
  styleUrls: ['./heat-map.component.scss'],
  providers: [HeatMapStoreService]
})
export class EpHeatMapComponent implements OnInit, OnDestroy {
  @Input() userId: string;
  @Input() entryId: string;
  @Input() duration: number;
  @Input() filter: KalturaEndUserReportInputFilter;
  @Input() actualStartDate: Date; // session actual start date

  public _isBusy = false;
  public _heatMap: HeatMapItem[] = [];

  constructor(private _heatMapStore: HeatMapStoreService,
              private _translate: TranslateService,
              private _el: ElementRef,
              private _zone: NgZone,
              private _renderer: Renderer2) {
  }

  ngOnInit() {
    if (this.userId && this.filter && this.entryId) {
      this._prepare();
    }
  }

  ngOnDestroy() {

  }

  private _prepare(): void {
    this._isBusy = true;

    this._heatMapStore.getHeatMap(this.userId, this.entryId, this.filter, this.actualStartDate)
      .pipe(cancelOnDestroy(this))
      .subscribe(
        points => {
          this._isBusy = false;
          this._heatMap = this._createHeatMap(points);
        },
        error => {
          this._isBusy = false;
        });
  }

  private _createHeatMap(points: HeatMapPoints): HeatMapItem[] {
    const items = [];
    points.forEach((point, index) => {
      const key = point === 'Offline' ? 'offline' : this._heatMapStore.isEngaged(point) ? 'engaged' : 'notEngaged';
      const color = key === 'offline' ? '#EBEBEB' : key === 'engaged' ? '#6391ED' : '#B5CDFC';
      const message = this._translate.instant(`app.entryEp.session.heatMap.${key}`);
      items.push({
        left: `${ index / points.length * 100}%`,
        width: `${100 / points.length}%`,
        color,
        tooltip: `<div class="kHeatMapTooltipWrapper"><div class="kDuration"></div><div class="kHeatMapTooltip"><i class="kBullet" style="background-color: ${color}"></i><span class="kMessage">${message}</span></div></div>`
      });
    });
    return items;
  }

  public onSectionMouseMove(event: MouseEvent): void {
    const minutes = (event.target as any).id;
    const hours = Math.floor(parseInt(minutes) / 60);
    const hrs = hours > 0 ? hours.toString() + ':' : '';
    let mins = (parseInt(minutes) % 60).toString();
    if (mins.length < 2) {
      mins = '0' + mins; // add leading zero if needed
    }
    const seconds = Math.abs(event.offsetX) / document.getElementById(minutes).offsetWidth * 60;
    let secs = Math.round(parseFloat(seconds.toString()) * 100 / 100).toString(); // round to 2 decimal places
    if (secs.length < 2) {
      secs = '0' + secs; // add leading zero if needed
    }
    if (secs === '60') {
      secs = '59'; // prevent showing 60 seconds
    }
    const durationTooltipElement = document.querySelector('.kHeatMapTooltipWrapper .kDuration');
    durationTooltipElement.innerHTML = this._translate.instant('app.entry.heatMap.duration', [hrs + mins + ":" + secs]);
  }

}
