import {Component, OnInit, Input, OnDestroy} from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportInterval } from 'kaltura-ngx-client';
import { DateFilterComponent } from './date-filter.component';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateRanges } from "./date-filter-utils";
import {DateChangeEvent} from "shared/components/date-filter/date-filter.service";
@Component({
  selector: 'app-time-units',
  templateUrl: './time-units.component.html',
  styleUrls: ['./time-units.component.scss']
})
export class TimeUnitsComponent implements OnInit, OnDestroy {
  @Input() set selectedTimeUnit(value: KalturaReportInterval) {
    if (value) {
      this._selectedTimeUnit = value;
    }
  }

  @Input() applyIn: string;

  @Input() displayHours = true;

  @Input() dateFilter: DateFilterComponent;

  public _selectedTimeUnit = KalturaReportInterval.months;

  public _timeUnitsItems: SelectItem[] = [
    {label: this._translate.instant('app.dateFilter.monthly'), value: KalturaReportInterval.months},
    {label: this._translate.instant('app.dateFilter.daily'), value: KalturaReportInterval.days},
  ];

  private dateChangeSubscription = null;

  constructor(private _translate: TranslateService, private _logger: KalturaLogger) {
  }
  ngOnInit() {
    if (typeof this.dateFilter === 'undefined') {
      this._logger.error('TimeUnitsComponent error:: missing data filter component input');
    }
    if (this.displayHours) {
      this._timeUnitsItems.push({label: this._translate.instant('app.dateFilter.hourly'), value: KalturaReportInterval.hours});
    }
    this.dateChangeSubscription = this.dateFilter.filterChange.subscribe(change => {
      if (this.displayHours && this._timeUnitsItems.length === 3) {
        const disableHours = this.getHoursDisabled(change);
        this._timeUnitsItems[2].disabled = disableHours;
        if (disableHours && this._selectedTimeUnit === KalturaReportInterval.hours) {
          this._selectedTimeUnit = KalturaReportInterval.days;
        }
      }
    });
  }
  public onTimeUnitsChange(): void {
    this.dateFilter.timeUnitsChange(this._selectedTimeUnit, this.applyIn);
  }

  private getHoursDisabled(change: DateChangeEvent): boolean {
    const delta = (change.endDate - change.startDate) / (60 * 60 *24); // find how many days are selected
    return delta > 30;
  }

  ngOnDestroy(): void {
    if (this.dateChangeSubscription) {
      this.dateChangeSubscription.unsubscribe();
      this.dateChangeSubscription = null;
    }
  }
}
