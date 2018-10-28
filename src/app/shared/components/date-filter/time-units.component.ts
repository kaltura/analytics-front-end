import { Component, OnInit, Input } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { KalturaReportInterval } from 'kaltura-ngx-client';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
@Component({
  selector: 'app-time-units',
  templateUrl: './time-units.component.html',
  styleUrls: ['./time-units.component.scss']
})
export class TimeUnitsComponent implements OnInit {
  @Input() dateFilter: DateFilterComponent;
  public timeUnitsItems: SelectItem[] = [
    {label: this._translate.instant('app.dateFilter.monthly'), value: KalturaReportInterval.months},
    {label: this._translate.instant('app.dateFilter.daily'), value: KalturaReportInterval.days},
  ];
  public selectedTimeUnit: KalturaReportInterval = KalturaReportInterval.months;
  constructor(private _translate: TranslateService, private _logger: KalturaLogger) {
  }
  ngOnInit() {
    if (typeof this.dateFilter === 'undefined') {
      this._logger.error('TimeUnitsComponent error:: missing data filter component input');
    }
  }
  public onTimeUnitsChange(): void {
    this.dateFilter.timeUnitsChange(this.selectedTimeUnit);
  }
}
