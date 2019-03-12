import { Component, ElementRef, HostListener, Input, NgZone, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { HeatMapPoints, HeatMapStoreService } from './heat-map-store.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { TranslateService } from '@ngx-translate/core';
import { ReportHelper } from 'shared/services';
import { KalturaEndUserReportInputFilter } from 'kaltura-ngx-client';

export interface HeatMapItem {
  color: string;
  plays: number;
  count: number;
  width: string;
  tooltip: string;
}

@Component({
  selector: 'app-heat-map',
  templateUrl: './heat-map.component.html',
  styleUrls: ['./heat-map.component.scss']
})
export class HeatMapComponent implements OnInit, OnDestroy {
  @Input() userId: string;
  @Input() entryId: string;
  @Input() duration: number;
  @Input() filter: KalturaEndUserReportInputFilter;
  
  private _heatMapColorScheme = ['#dfe9ff', '#487adf', '#2655b0', '#1d4694'];
  
  public _isBusy = false;
  public _heatMap: HeatMapItem[] = [];
  
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
          durationTooltipElement.innerHTML = this._translate.instant('app.entry.heatMap.duration', [progressValue]);
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
    
    this._heatMapStore.getHeatMap(this.userId, this.entryId, this.filter)
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
            plays: value,
            count: 1,
          });
        } else {
          acc[acc.length - 1].count += 1;
        }
        
        return acc;
      }, [])
      .map((item, index, array) => {
        item.width = `${item.count / array.length * 100}%`;
        
        const message = this._translate.instant(`app.entry.heatMap.tooltip.${item.plays > 2 ? 'n' : item.plays}`);
        item.tooltip = `
          <div class="kHeatMapTooltipWrapper">
            <div class="kDuration"></div>
            <div class="kHeatMapTooltip">
              <i class="kBullet" style="background-color: ${item.color}"></i>
              <span class="kMessage">${message}</span>
            </div>
          </div>
        `;
        
        return item;
      });
  }
  
  private _getColor(countPlays: number): string {
    if (countPlays > 2) {
      return this._heatMapColorScheme[3];
    }
    
    return this._heatMapColorScheme[countPlays];
  }
}
