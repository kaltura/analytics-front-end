import { Component, ElementRef, HostListener, Input, NgZone, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { HeatMapPoints, HotspotHeatMapStoreService } from './hotspot-heat-map-store.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TranslateService } from '@ngx-translate/core';
import { ReportHelper } from 'shared/services';
import { KalturaEndUserReportInputFilter } from 'kaltura-ngx-client';
import { HotSpot } from "../../path-content.service";

export interface HeatMapItem {
  color: string;
  clicks: number;
  count: number;
  width: string;
  tooltip: string;
}

@Component({
  selector: 'app-hotspot-heat-map',
  templateUrl: './hotspot-heat-map.component.html',
  styleUrls: ['./hotspot-heat-map.component.scss']
})
export class HotspotHeatMapComponent implements OnInit, OnDestroy {
  @Input() hotspot: HotSpot;
  @Input() duration: number;
  @Input() filter: KalturaEndUserReportInputFilter;

  private _heatMapColorScheme = ['rgba(0,0,0,0)', '#b5cdfc', '#487adf', '#3567ca', '#1d4694'];

  public _isBusy = false;
  public _heatMap: HeatMapItem[] = [];
  public _leftOffsetWidth = 0;
  public _rightOffsetWidth = 0;

  @ViewChild('follower') _follower: ElementRef;

  @HostListener('mousemove', ['$event'])
  public onMouseMove(event: MouseEvent): void {
    if (!this._follower || !this._el) {
      return;
    }
    const threshold = 3;
    const follower = this._follower.nativeElement as HTMLElement;
    const el = this._el.nativeElement as HTMLElement;
    const rect = el.getClientRects()[0] as ClientRect;
    let mouseX = Math.min(event.pageX - rect.left, el.offsetWidth) - threshold;

    if (mouseX < 0) {
      mouseX = 0;
    }

    this._renderer.setStyle(follower, 'display', 'block');
    this._renderer.setStyle(follower, 'left', `${mouseX}px`);

    setTimeout(() => { // let tooltip render on page
      const durationTooltipElement = document.querySelector('.kHeatMapTooltipWrapper .kDuration');
      if (durationTooltipElement) {
        this._zone.runOutsideAngular(() => { // run outside of angular to prevent unwanted change detections
          const progressPercent = Math.round((mouseX + threshold) / el.offsetWidth * 100) / 100;
          const progressValue = ReportHelper.time(String(progressPercent * this.duration));
          durationTooltipElement.innerHTML = this._translate.instant('app.playlist.heatMap.duration', [progressValue]);
        });
      }
    }, 0);
  }

  @HostListener('mouseleave')
  public onMouseLeave(): void {
    if (this._follower) {
      this._renderer.setStyle(this._follower.nativeElement, 'display', 'none');
    }
  }


  constructor(private _heatMapStore: HotspotHeatMapStoreService,
              private _translate: TranslateService,
              private _el: ElementRef,
              private _zone: NgZone,
              private _renderer: Renderer2) {
  }

  ngOnInit() {
    if (this.hotspot.type && this.filter && this.hotspot.id) {
      this._prepare();
    }
  }

  ngOnDestroy() {

  }

  private _prepare(): void {
    this._isBusy = true;
    this._leftOffsetWidth = this.hotspot.startTime * 100;
    this._rightOffsetWidth = (1 - this.hotspot.endTime) * 100;
    this._heatMapStore.getHeatMap(this.hotspot.type, this.hotspot.id, this.filter)
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
    return points
      .reduce((acc, value) => {
        if (acc.length === 0 || acc[acc.length - 1].plays !== value) {
          acc.push({
            color: this._getColor(value),
            clicks: value,
            count: 1,
          });
        } else {
          acc[acc.length - 1].count += 1;
        }

        return acc;
      }, [])
      .map((item, index, array) => {
        item.width = `${item.count / array.length * 100}%`;
        if (item.clicks > 0 || (index > this.hotspot.startTime * 100 && index < this.hotspot.endTime * 100)) {
          const message = this._translate.instant(`app.playlist.heatMap.tooltip.${item.clicks > 3 ? 'n' : item.clicks}`);
          item.tooltip = `<div class="kHeatMapTooltipWrapper"><div class="kDuration"></div><div class="kHeatMapTooltip"><i class="kBullet" style="background-color: ${item.color}; border: ${item.clicks === 0 ? '1px solid #88acf6' : 'none'}"></i><span class="kMessage">${message}</span></div></div>`;
        }
        return item;
      });
  }

  private _getColor(countPlays: number): string {
    if (countPlays > 3) {
      return this._heatMapColorScheme[4];
    }

    return this._heatMapColorScheme[countPlays];
  }
}
