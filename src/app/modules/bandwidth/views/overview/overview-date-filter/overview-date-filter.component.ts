import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {OverviewDateRange} from "./overview-date-range.type";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {TranslateService} from "@ngx-translate/core";
import {KalturaReportInterval} from "kaltura-ngx-client";
import {AuthService} from "shared/services";

@Component({
  selector: 'app-overview-date-filter',
  templateUrl: './overview-date-filter.component.html',
  styleUrls: ['./overview-date-filter.component.scss']
})
export class OverviewDateFilterComponent implements OnInit {

  @Output() filterChange = new EventEmitter<OverviewDateRange>();

  public selectedDateRangeKey = 'month-0';
  public selectedDateRange: OverviewDateRange = null;
  public labelPostfix = '';
  public monthlyDateRangeItems: OverviewDateRange[] = [];
  public yearlyDateRangeItems: OverviewDateRange[] = [];

  constructor(private _translate: TranslateService,
              private _authService: AuthService) {
  }

  ngOnInit(): void {
    this._createTimeRanges();
    if (!this.selectedDateRange) {
      setTimeout(() => {
        this.updateDataRanges();
      });
    }
  }

  private _createTimeRanges(): void {
    const today = new Date();
    const partnerCreationDate = new Date(this._authService.partnerCreatedAt);
    const partnerCreationYear = partnerCreationDate.getFullYear();
    const currentYear = today.getFullYear();
    this.yearlyDateRangeItems = [{
      key: 'year-0',
      label: this._translate.instant('app.dateFilter.currentYear'),
      startDate: DateFilterUtils.toServerDate(new Date(`${currentYear}-01-01`), true),
      endDate: DateFilterUtils.toServerDate(today, false),
      interval: KalturaReportInterval.hours
    }];
    // add up to 5 years to available years
    for (let i = 1; i < 5; i++) {
      const year = currentYear - i;
      if (year >= partnerCreationYear) {
        this.yearlyDateRangeItems.push({
          key: `year-${i}`,
          label: year.toString(),
          startDate: DateFilterUtils.toServerDate(new Date(`${year}-01-01`), true),
          endDate: DateFilterUtils.toServerDate(new Date(`${year}-12-31`), false),
          interval: KalturaReportInterval.hours
        });
      }
    }
    let currentMonth = today.getMonth() + 1;
    const monthsDiff = today.getMonth() - partnerCreationDate.getMonth() + (12 * (today.getFullYear() - partnerCreationDate.getFullYear()));
    this.monthlyDateRangeItems = [{
      key: 'month-0',
      label: this._translate.instant('app.dateFilter.currentMonth'),
      startDate: DateFilterUtils.toServerDate(new Date(`${currentYear}-${currentMonth}-01`), true),
      endDate: DateFilterUtils.toServerDate(today, false),
      interval: KalturaReportInterval.months
    }];
    // add up to 12 months to available months
    let year = currentYear;
    for (let i = 1; i < 12; i++) {
      if (i <= monthsDiff) {
        let month = currentMonth - i;
        if (month < 1) {
          month = month + 12;
          year = currentYear - 1;
        }
        const monthName = new Date(`${year}-${month}-01`).toLocaleString('default', { month: 'long' });
        this.monthlyDateRangeItems.push({
          key: `month-${i}`,
          label: `${monthName} ${year}`,
          startDate: DateFilterUtils.toServerDate(new Date(`${year}-${month}-01`), true),
          endDate: DateFilterUtils.toServerDate(new Date(year,month,0), false),
          interval: KalturaReportInterval.months
        });
      }
    }
  }

  updateDataRanges() {
    const keys = this.selectedDateRangeKey.split('-');
    if (keys && keys.length === 2) {
      const index = parseInt(keys[1]);
      if (keys[0] === "year") {
        this.selectedDateRange = this.yearlyDateRangeItems[index];
        this.labelPostfix = index === 0 ? new Date().getFullYear().toString() : '';
      } else {
        this.selectedDateRange = this.monthlyDateRangeItems[index];
        this.labelPostfix = index === 0 ? new Date().toLocaleString('default', { month: 'long' }) + ' ' + new Date().getFullYear().toString() : '';
      }
    }
    this.filterChange.emit(this.selectedDateRange);
  }
}
