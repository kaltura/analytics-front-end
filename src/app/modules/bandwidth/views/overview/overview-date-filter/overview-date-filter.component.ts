import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {OverviewDateRange} from "./overview-date-range.type";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {TranslateService} from "@ngx-translate/core";
import {KalturaReportInterval} from "kaltura-ngx-client";
import {AuthService} from "shared/services";
import {SelectItem} from "primeng/api";
import {analyticsConfig} from "configuration/analytics-config";

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

  public viewItems: SelectItem[] = [
    {label: this._translate.instant('app.dateFilter.preset'), value: 'preset'},
    {label: this._translate.instant('app.dateFilter.specific'), value: 'specific'},
  ];
  public selectedView = 'preset';
  public _dateFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'mm/dd/yy' : 'dd/mm/yy';
  public localeData = {};
  public specificStart: Date = new Date();
  public specificEnd: Date = new Date();
  public validDateRange = true;
  public specificDateRange: Date[] = [this.specificStart, this.specificEnd];

  constructor(private _translate: TranslateService,
              private _authService: AuthService) {
    this.localeData = DateFilterUtils.getLocalData(analyticsConfig.locale);
  }

  ngOnInit(): void {
    this._createTimeRanges();
    if (!this.selectedDateRange) {
      setTimeout(() => {
        this.updateDataRanges();
      });
    }
  }

  private _createTimeRanges(event = "preset"): void {
    if (event === "specific") {
      return; // no need to set time ranges for specific periods
    }
    const today = new Date();
    const partnerCreationDate = new Date(this._authService.partnerCreatedAt);
    const partnerCreationYear = partnerCreationDate.getFullYear();
    const currentYear = today.getFullYear();
    this.yearlyDateRangeItems = [{
      key: 'year-0',
      label: this._translate.instant('app.dateFilter.currentYear'),
      startDate: DateFilterUtils.toServerDate(new Date(`${currentYear}-01-01`), true),
      endDate: DateFilterUtils.toServerDate(today, false),
      interval: KalturaReportInterval.years,
      isSpecific: false
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
          interval: KalturaReportInterval.years,
          isSpecific: false
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
      interval: KalturaReportInterval.months,
      isSpecific: false
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
          interval: KalturaReportInterval.months,
          isSpecific: false
        });
      }
    }
  }

  updateDataRanges() {
    if (this.selectedView === 'preset') {
      const keys = this.selectedDateRangeKey.split('-');
      if (keys && keys.length === 2) {
        const index = parseInt(keys[1]);
        if (keys[0] === "year") {
          this.selectedDateRange = this.yearlyDateRangeItems[index];
          this.labelPostfix = index === 0 ? new Date().getFullYear().toString() : '';
        } else {
          this.selectedDateRange = this.monthlyDateRangeItems[index];
          this.labelPostfix = index === 0 ? new Date().toLocaleString('default', {month: 'long'}) + ' ' + new Date().getFullYear().toString() : '';
        }
      }
    } else {
      this.selectedDateRange.startDate = DateFilterUtils.toServerDate(this.specificDateRange[0], true);
      this.selectedDateRange.endDate = DateFilterUtils.toServerDate(this.specificDateRange[1], false);
      this.selectedDateRange.interval = KalturaReportInterval.days;
      this.labelPostfix = `${DateFilterUtils.getMomentDate(this.selectedDateRange.startDate).format('MMM D, YYYY')} - ${DateFilterUtils.getMomentDate(this.selectedDateRange.endDate).format('MMM D, YYYY')}`;
      this.selectedDateRange.label = this.labelPostfix;
      this.selectedDateRange.isSpecific = true;
    }
    this.filterChange.emit(this.selectedDateRange);
  }

  public updateSpecific(): void {
    this.validate();
    this.specificDateRange = [this.specificStart, this.specificEnd];
  }

  private validate(): void {
    this.validDateRange = !this.specificEnd || DateFilterUtils.toServerDate(this.specificEnd, false) >= DateFilterUtils.toServerDate(this.specificStart, true); // validation
  }

  public get _applyDisabled(): boolean {
    return this.selectedView === 'specific' && this.specificDateRange.filter(Boolean).length !== 2 || !this.validDateRange;
  }

  public updateSpecificCalendars(): void {
    setTimeout(() => { // use a timeout to allow binded variables to update before calculations
      this.specificStart = this.specificDateRange[0];
      this.specificEnd = this.specificDateRange[1];
      this.validate();
    }, 0);
  }
}
