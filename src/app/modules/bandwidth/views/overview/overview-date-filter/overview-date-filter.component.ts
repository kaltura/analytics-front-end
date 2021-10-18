import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {OverviewDateRange} from "./overview-date-range.type";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {analyticsConfig} from "configuration/analytics-config";
import {TranslateService} from "@ngx-translate/core";
import {KalturaReportInterval} from "kaltura-ngx-client";
import {AuthService} from "shared/services";
import * as moment from 'moment';

@Component({
  selector: 'app-overview-date-filter',
  templateUrl: './overview-date-filter.component.html',
  styleUrls: ['./overview-date-filter.component.scss']
})
export class OverviewDateFilterComponent implements OnInit {

  @Input() availableDateRange: AvailabilityDateRange;
  @Output() filterChange = new EventEmitter<OverviewDateRange>();

  public selectedDateRange: OverviewDateRange;
  public appliedDateRange: OverviewDateRange;
  public monthlyDateRangeItems: OverviewDateRange[] = [];
  public yearlyDateRangeItems: OverviewDateRange[] = [];

  public applyDisabled = false;
  private localeData = DateFilterUtils.getLocalData(analyticsConfig.locale);

  constructor(private _translate: TranslateService,
              private _authService: AuthService) {
  }

  ngOnInit(): void {
    this._createTimeRanges();
    /*
    const currentMonth = this._translate.instant('app.dateFilter.prefix.month');
    const currentYear = this._translate.instant('app.dateFilter.prefix.year');
    const specific = this._translate.instant('app.dateFilter.specificLabel');
    this.monthlyDateRangeItems = getMonths(this.availableDateRange, this.localeData.monthNames, currentMonth, specific).reverse();
    this.yearlyDateRangeItems = getYears(this.availableDateRange, currentYear, specific).reverse();
    if (!this.selectedDateRange) {
      this.selectedDateRange = this.monthlyDateRangeItems[0];
      setTimeout(() => {
        this.updateDataRanges();
      });
    }*/
  }

  private _createTimeRanges(): void {
    const today = new Date();
    const partnerCreationDate = new Date(this._authService.partnerCreatedAt);
    const partnerCreationYear = partnerCreationDate.getFullYear();
    const currentYear = today.getFullYear();
    this.yearlyDateRangeItems = [{
      label: this._translate.instant('app.dateFilter.currentYear'),
      startDate: DateFilterUtils.toServerDate(new Date(`${currentYear}-01-01`), true),
      endDate: DateFilterUtils.toServerDate(today, false)
    }];
    // add up to 5 years to available years
    for (let i = 1; i < 5; i++) {
      const year = currentYear - i;
      if (year >= partnerCreationYear) {
        this.yearlyDateRangeItems.push({
          label: year.toString(),
          startDate: DateFilterUtils.toServerDate(new Date(`${year}-01-01`), true),
          endDate: DateFilterUtils.toServerDate(new Date(`${year}-12-31`), false)
        });
      }
    }
    let currentMonth = today.getMonth() + 1;
    const monthsDiff = today.getMonth() - partnerCreationDate.getMonth() + (12 * (today.getFullYear() - partnerCreationDate.getFullYear()));
    this.monthlyDateRangeItems = [{
      label: this._translate.instant('app.dateFilter.currentMonth'),
      startDate: DateFilterUtils.toServerDate(new Date(`${currentYear}-${currentMonth}-01`), true),
      endDate: DateFilterUtils.toServerDate(new Date(currentYear,currentMonth,0), false)
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
          label: `${monthName} ${year}`,
          startDate: DateFilterUtils.toServerDate(new Date(`${year}-${month}-01`), true),
          endDate: DateFilterUtils.toServerDate(new Date(year,month,0), false)
        });
      }
    }
  }

  updateDataRanges() {
    this.appliedDateRange = this.selectedDateRange;
    this.filterChange.emit(this.selectedDateRange);
  }
}

export interface AvailabilityDateRange {
  startDate: Date;
  endDate: Date;
}
/*
function getMonths(dateRange: AvailabilityDateRange, monthNames: string[], currentMonthLabel: string, specificLabel: string) {
  let startMonth = dateRange.startDate.getMonth();
  let startYear = dateRange.startDate.getFullYear();
  let endMonth = dateRange.endDate.getMonth();
  let endYear = dateRange.endDate.getFullYear();
  let dates: OverviewDateRange[] = [];
  const currentDate = new Date();

  for (let i = startYear; i <= endYear; i++) {
    let endMon = i !== endYear ? 11 : endMonth;
    let startMon = i === startYear ? startMonth : 0;
    for (let month = startMon; month <= endMon; month = month > 12 ? month % 12 || 11 : month + 1) {
      const label = monthNames[month] + ' ' + i;
      const isCurrent = currentDate.getFullYear() && currentDate.getMonth() === month;
      const prefix = isCurrent ? currentMonthLabel : specificLabel;
      dates.push({label, prefix, isCurrent, value: new Date(i, month), interval: KalturaReportInterval.months});
    }
  }
  return dates;
}

function getYears(dateRange: AvailabilityDateRange, currentYearLabel: string, specificLabel: string) {
  let startYear = dateRange.startDate.getFullYear();
  let endYear = dateRange.endDate.getFullYear();
  let dates: OverviewDateRange[] = [];
  const currentDate = new Date();

  for (let i = startYear; i <= endYear; i++) {
    const label = i.toString();
    const isCurrent = i === currentDate.getFullYear();
    const prefix = isCurrent ? currentYearLabel : specificLabel;
    dates.push({label, prefix, isCurrent, value: new Date(i, 0), interval: KalturaReportInterval.months}); // TODO: needs to have years interval
  }
  return dates;
}
*/
