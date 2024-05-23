import {Component, Input, OnDestroy} from '@angular/core';
import {KalturaEndUserReportInputFilter, KalturaReportGraph, KalturaReportInterval, KalturaReportTotal, KalturaReportType} from 'kaltura-ngx-client';
import {ReportDataConfig, ReportDataSection} from 'shared/services/storage-data-base.config';
import {analyticsConfig} from 'configuration/analytics-config';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {AuthService, ErrorsManagerService, ReportConfig, ReportHelper, ReportService} from 'shared/services';
import {cancelOnDestroy} from '@kaltura-ng/kaltura-common';
import {SelectItem} from 'primeng/api';
import {EventOverTimeConfig} from './event-over-time.config';
import {reportTypeMap} from 'shared/utils/report-type-map';
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {Tab} from "shared/components/report-tabs/report-tabs.component";
import {TranslateService} from "@ngx-translate/core";
import * as moment from "moment";
import {isEmptyObject} from "shared/utils/is-empty-object";

@Component({
  selector: 'app-event-over-time',
  templateUrl: './event-over-time.component.html',
  styleUrls: ['./event-over-time.component.scss'],
  providers: [EventOverTimeConfig],
})
export class EventOverTimeComponent implements OnDestroy {

  @Input() eventIn = '';
  @Input() set virtualEventLoaded(value: boolean) {
    if (value === true) {
      // use timeout to allow data binding to finish
      setTimeout(() => {
        this._setEventDays();
        this._loadReport();
      }, 0);
    }
  }
  @Input() exporting = false;
  @Input() startDate: Date;
  @Input() endDate: Date;

  private _now: Date = new Date();
  private _dataConfig: ReportDataConfig;
  private _totalAttendees = 0;
  private _totalMinutesViewed = 0;

  public _tabsData: Tab[] = [
    {title: this._translate.instant('app.event.during'), selected: true, value: 'during'},
    {title: this._translate.instant('app.event.post'), selected: false, value: 'post'}
  ];
  public _selectedTab = 'during';

  public _metrics = [
    { label: this._translate.instant('app.event.attendees'), value: 'attendees' },
    { label: this._translate.instant('app.event.minutes'), value: 'minutes' },
  ];
  public _metric = 'attendees';

  public _multiDatesEvent = false;
  public _days = [];
  public _selectedDay = -1;

  public _timeUnitsItems: SelectItem[] = [
    {label: this._translate.instant('app.dateFilter.monthly'), value: KalturaReportInterval.months},
    {label: this._translate.instant('app.dateFilter.daily'), value: KalturaReportInterval.days},
  ];
  public _selectedTimeUnit = KalturaReportInterval.days;

  public _lineChartData: any = {};
  public _barChartData: any = {};

  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;

  constructor(private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _dataConfigService: EventOverTimeConfig) {
    this._dataConfig = this._dataConfigService.getConfig();
  }

  ngOnDestroy(): void {
  }

  private _setEventDays(): void {
    // check if the event lasted more than 1 day
    const date1 = moment(this.startDate);
    const date2 = moment(this.endDate);
    const daysDifference = date2.diff(date1, 'days');
    this._multiDatesEvent = daysDifference > 0;
    if (this._multiDatesEvent) {
      const dateFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
      this._days = [];
      this._days.push({ label: this._translate.instant('app.event.allDays'), value: -1 });
      for (let i = 0; i <= daysDifference; i++) {
        this._days.push({label: date1.add(i, 'days').format(dateFormat), value: i});
      }
    }
  }

  public _loadReport(): void {
    this._isBusy = true;
    this._lineChartData = {};
    this._barChartData = {};
    this._blockerMessage = null;
    this._filter.virtualEventIdIn = this.eventIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
    this._filter.interval = KalturaReportInterval.days;
    this._dataConfig = this._metric === 'attendees' ? this._dataConfigService.getConfig() : this._dataConfigService.getMinutesConfig();
    const reportType = this._metric === 'attendees' ? reportTypeMap(KalturaReportType.epAttendees) :  reportTypeMap(KalturaReportType.epLiveViewtime);
    if (this._selectedTab === 'during') {
      // for single day event of multi day event with 'all days' selected
      this._filter.fromDate = Math.floor(this.startDate.getTime() / 1000);
      this._filter.toDate = Math.floor(this.endDate.getTime() / 1000);
      if (this._multiDatesEvent && this._selectedDay > -1) {
        this._filter.interval = KalturaReportInterval.hours;
        if (this._selectedDay > 0) {
          this._filter.fromDate = moment(this.startDate).add(this._selectedDay, 'days').startOf('day').unix();
        }
        if (this._selectedDay < this._days.length - 2) {
          this._filter.toDate = moment(this.startDate).add(this._selectedDay, 'days').endOf('day').unix();
        }
      }
    } else {
      this._filter.fromDate = Math.floor(this.endDate.getTime() / 1000);
      this._filter.toDate = Math.floor(new Date().getTime() / 1000);
      this._filter.interval = this._selectedTimeUnit;
    }
    const reportConfig: ReportConfig = { reportType, filter: this._filter, order: '-unique_event_attendees' };
    this._reportService.getReport(reportConfig, this._dataConfig, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.totals && report.totals.data && report.totals.header) {
             this._handleTotals(report.totals); // handle totals
          }
          if (report.graphs.length) {
            this._handleGraphs(report.graphs); // handle graphs
          }
          this._isBusy = false;
          this._blockerMessage = null;
        },
        error => {
          this._isBusy = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadReport();
            },
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });

  }

  private _handleTotals(totals: KalturaReportTotal): void {
    const tabsData = this._reportService.parseTotals(totals, this._dataConfig.totals);
    if (this._metric === 'attendees') {
      this._totalAttendees = tabsData[0].rawValue !== '' ? parseInt(tabsData[0].rawValue.toString()) : 0;
    } else {
      this._totalMinutesViewed = tabsData[0].rawValue !== '' ? parseInt(tabsData[0].rawValue.toString()) : 0;
    }
  }

  private _handleGraphs(graphs: KalturaReportGraph[]): void {
    const { barChartData, lineChartData } = this._reportService.parseGraphs(
      graphs,
      this._dataConfig.graph,
      { from: this._filter.fromDate, to: this._filter.toDate },
      this._filter.interval,
    );
    const graphMetric = this._metric === 'attendees' ? 'unique_event_attendees' : 'live_meeting_play_time';
    const calcPercent = (originalGraph: any) => {
      const tooltip = originalGraph.tooltip;
      const graph = JSON.parse(JSON.stringify(originalGraph));
      if (graph?.series.length) {
        graph.series[0].data.forEach(
          (value, index) => {
            let newVal = 0;
            if (this._metric === 'attendees' && this._totalAttendees > 0) {
              newVal = ReportHelper.precisionRound(value / this._totalAttendees * 100, 1);
            }
            if (this._metric === 'minutes' && this._totalMinutesViewed > 0) {
              newVal = ReportHelper.precisionRound(value / this._totalMinutesViewed * 100, 1);
            }
            graph.series[0].data[index] = newVal;
          }
        );
        graph.yAxis.axisLabel.formatter = param => `${param}%`;
        graph.yAxis.min = 0;
        graph.yAxis.max = 100;
        graph.tooltip = tooltip;
        return graph;
      }
    };
    this._barChartData = !isEmptyObject(barChartData) ? barChartData[graphMetric] : null;
    this._barChartData = calcPercent(this._barChartData);
    this._lineChartData = !isEmptyObject(lineChartData) ? lineChartData[graphMetric] : null;
    this._lineChartData = calcPercent(this._lineChartData);
  }

  public _onTabChange(tab: Tab): void {
    this._tabsData.forEach(tab => tab.selected = false);
    tab.selected = true;
    this._selectedTab = tab.value;
    this._loadReport();
  }
}


