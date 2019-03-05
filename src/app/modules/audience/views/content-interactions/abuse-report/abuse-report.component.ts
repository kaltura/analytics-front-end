import { Component } from '@angular/core';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportInputFilter, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { AbuseReportDataConfig } from './abuse-report-data.config';
import { TranslateService } from '@ngx-translate/core';
import { EChartOption } from 'echarts';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { InteractionsBaseReportComponent } from '../interactions-base-report/interactions-base-report.component';

@Component({
  selector: 'app-abuse-report',
  templateUrl: './abuse-report.component.html',
  styleUrls: ['./abuse-report.component.scss'],
  providers: [
    KalturaLogger.createLogger('AbuseReportComponent'),
    AbuseReportDataConfig,
    ReportService,
  ],
})
export class AbuseReportComponent extends InteractionsBaseReportComponent {
  private _reportType = KalturaReportType.contentDropoff;
  private _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 25, pageIndex: 1 });
  private _filter = new KalturaReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _compareFilter: KalturaReportInputFilter = null;
  private _reportInterval = KalturaReportInterval.months;
  private _dataConfig: ReportDataConfig;
  
  protected _dateFilter: DateChangeEvent;
  protected _refineFilter: RefineFilter = [];
  protected _componentId = 'abuse';
  
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  
  public get isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _translate: TranslateService,
              private _authService: AuthService,
              private _compareService: CompareService,
              private _dataConfigService: AbuseReportDataConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  protected _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
    if (this._dateFilter.compare.active) {
      const compare = this._dateFilter.compare;
      this._compareFilter = Object.assign(KalturaObjectBaseFactory.createObject(this._filter), this._filter);
      this._compareFilter.fromDate = compare.startDate;
      this._compareFilter.toDate = compare.endDate;
    } else {
      this._compareFilter = null;
    }
  }
  
  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    refineFilterToServerValue(this._refineFilter, this._filter);
    if (this._compareFilter) {
      refineFilterToServerValue(this._refineFilter, this._compareFilter);
    }
  }
}
