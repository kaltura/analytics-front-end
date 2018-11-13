import { Component, OnInit } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import {AreaBlockerMessage, AreaBlockerMessageButton} from '@kaltura-ng/kaltura-ui';
import {ErrorDetails, ErrorsManagerService, ReportConfig, ReportService} from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import {
  KalturaFilterPager,
  KalturaReportInputFilter,
  KalturaReportInterval,
  KalturaReportType
} from 'kaltura-ngx-client';
import { SelectItem } from 'primeng/api';
import { map, switchMap } from 'rxjs/operators';
import { of as ObservableOf } from 'rxjs';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { ImpressionsDataConfig } from './impressions-data.config';
import {GeoLocationDataConfig} from "../../geo-location/geo-location-data.config";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-engagement-impressions',
  templateUrl: './impressions.component.html',
  styleUrls: ['./impressions.component.scss']
})
export class EngagementImpressionsComponent extends EngagementBaseReportComponent implements OnInit {

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _playthroughs: SelectItem[] = [{label: '25%', value: 25}, {label: '50%', value: 50}, {label: '75%', value: 75}, {label: '100%', value: 100}];
  public _selectedPlaythrough: SelectItem = {label: '25%', value: 25};
  public _chartData = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c}%'
    },
    color: ['#00745C', '#008569', '#00A784'],
    calculable: true,
    series: [
      {
        name: 'Player Impressions',
        type: 'funnel',
        left: '35%',
        top: 10,
        bottom: 10,
        width: '60%',
        height: 340,
        min: 0,
        max: 100,
        minSize: '5%',
        maxSize: '100%',
        sort: 'descending',
        gap: 0,
        label: {
          show: true,
          verticalAlign: 'top',
          position: 'inside',
          formatter: '{c}%',
          fontFamily: 'Lato',
          fontSize: 15,
          fontWeight: 'bold'
        },
        labelLine: {
          show: false
        },
        itemStyle: {
          borderWidth: 0
        },
        data: [
          // {value: 20, name: 'Playthrough'},
          // {value: 80, name: 'Plays'},
          // {value: 100, name: 'Impressions'}
        ]
      }
    ]
  };

  private reportType: KalturaReportType = KalturaReportType.contentDropoff;
  private pager: KalturaFilterPager = new KalturaFilterPager({pageSize: 25, pageIndex: 1});
  private order = 'count_plays';
  private filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  private compareFilter: KalturaReportInputFilter = null;
  private _reportInterval: KalturaReportInterval = KalturaReportInterval.months;
  private _dataConfig: ReportDataConfig;
  public get isCompareMode(): boolean {
    return this.compareFilter !== null;
  }

  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _compareService: CompareService,
              private _dataConfigService: ImpressionsDataConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit() {
    this._isBusy = false;
  }
  
  protected _loadReport(): void {
    this.filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this.filter.fromDay = this._dateFilter.startDay;
    this.filter.toDay = this._dateFilter.endDay;
    this.filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this.pager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this.compareFilter = new KalturaReportInputFilter(
        {
          searchInTags: true,
          searchInAdminTags: false,
          timeZoneOffset: this._dateFilter.timeZoneOffset,
          interval: this._dateFilter.timeUnits,
          fromDay: compare.startDay,
          toDay: compare.endDay,
        }
      );
    } else {
      this.compareFilter = null;
    }
    this._isBusy = true;
    this._blockerMessage = null;
    const reportConfig: ReportConfig = { reportType: this.reportType, filter: this.filter, pager: this.pager, order: this.order };
    this._reportService.getReport(reportConfig, this._dataConfig)
      .pipe(switchMap(report => {
        if (!this.isCompareMode) {
          return ObservableOf({ report, compare: null });
        }

        const compareReportConfig = { reportType: this.reportType, filter: this.compareFilter, pager: this.pager, order: this.order };
        return this._reportService.getReport(compareReportConfig, sections)
          .pipe(map(compare => ({ report, compare })));
      }))
      .subscribe(({ report, compare }) => {
          if (compare) {
            this.handleCompare(report, compare);
          } else {
            if (report.totals) {
              this.handleTotals(report.totals); // handle totals
            }
          }
          this.prepareCsvExportHeaders();
          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          const err: ErrorDetails = this._errorsManager.getError(error);
          let buttons: AreaBlockerMessageButton[] = [];
          if ( err.forceLogout ) {
            buttons = [{
              label: this._translate.instant('app.common.ok'),
              action: () => {
                this._blockerMessage = null;
                this._authService.logout();
              }
            }];
          } else {
            buttons = [{
              label: this._translate.instant('app.common.close'),
              action: () => {
                this._blockerMessage = null;
              }
            },
              {
                label: this._translate.instant('app.common.retry'),
                action: () => {
                  this.loadReport();
                }
              }];
          }
          this._blockerMessage = new AreaBlockerMessage({
            title: err.title,
            message: err.message,
            buttons
          });
        });
  }

}
