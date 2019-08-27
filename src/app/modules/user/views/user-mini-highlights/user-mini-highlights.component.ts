import { Component, Input, OnDestroy } from '@angular/core';
import {
  KalturaClient,
  KalturaEndUserReportInputFilter,
  KalturaFilterPager,
  KalturaMultiRequest,
  KalturaObjectBaseFactory,
  KalturaReportInterval,
  KalturaReportResponseOptions,
  KalturaReportTable,
  KalturaReportTotal,
  KalturaReportType,
  ReportGetTableAction,
  ReportGetTotalAction
} from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { ErrorsManagerService, ReportHelper, ReportService } from 'shared/services';
import { UserBase } from '../user-base/user-base';
import { UserMiniHighlightsConfig } from './user-mini-highlights.config';
import { map, switchMap } from 'rxjs/operators';
import { Observable, of as ObservableOf } from 'rxjs';
import { UserMiniHighlightsGeoData } from './geo/geo.component';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { UserMiniHighlightsDevicesData } from './devices/devices.component';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { reportTypeMap } from 'shared/utils/report-type-map';

export interface UserMiniHighlightsReportData {
  geo: { table: KalturaReportTable };
  devices: { table: KalturaReportTable, totals: KalturaReportTotal };
}

@Component({
  selector: 'app-user-mini-highlights',
  templateUrl: './user-mini-highlights.component.html',
  styleUrls: ['./user-mini-highlights.component.scss'],
  providers: [UserMiniHighlightsConfig],
})
export class UserMiniHighlightsComponent extends UserBase implements OnDestroy {
  @Input() userId: string;
  
  private _dataConfig: ReportDataConfig;
  
  protected _componentId = 'mini-highlights';
  
  public _columns: string[] = [];
  public _firstTimeLoading = true;
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _currentDates: string;
  public _compareDates: string;
  public _reportInterval = KalturaReportInterval.days;
  public _geoData: UserMiniHighlightsGeoData = null;
  public _compareGeoData: UserMiniHighlightsGeoData = null;
  public _devicesData: UserMiniHighlightsDevicesData = null;
  public _compareDevicesData: UserMiniHighlightsDevicesData = null;
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: UserMiniHighlightsConfig,
              private _kalturaClient: KalturaClient) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  ngOnDestroy() {
  }
  
  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._blockerMessage = null;
    
    this._filter.userIds = this.userId;
    
    this._getReport(this._filter)
      .pipe(switchMap(current => {
        if (!this._isCompareMode) {
          return ObservableOf({ current, compare: null });
        }
        
        this._compareFilter.userIds = this.userId;
        
        return this._getReport(this._compareFilter).pipe(map(compare => ({ current, compare })));
      }))
      .subscribe(({ current, compare }) => {
          this._handleReportData(current, compare);
          
          this._firstTimeLoading = false;
          this._isBusy = false;
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
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
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
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
  }
  
  private _handleReportData(current: UserMiniHighlightsReportData, compare?: UserMiniHighlightsReportData): void {
    if (compare) {
      this._handleCompareReportData(current, compare);
    } else {
      this._currentDates = null;
      this._compareDates = null;
      this._compareGeoData = null;
      this._compareDevicesData = null;

      const { geo, devices } = this._handleCurrentReportData(current);
      this._geoData = geo;
      this._devicesData = devices;
    }
  }
  
  private _handleCurrentReportData(data: UserMiniHighlightsReportData): { geo: UserMiniHighlightsGeoData, devices: UserMiniHighlightsDevicesData } {
    let result = {
      geo: null,
      devices: null,
    };

    if (data.geo.table.data) {
      const geoTable = this._reportService.parseTableData(data.geo.table, this._dataConfig.geoTable);
      result.geo = geoTable.tableData.length ? <any>geoTable.tableData[0] : null;
    }
    
    if (data.devices.table.data && data.devices.totals.data) {
      const devicesTable = this._reportService.parseTableData(data.devices.table, this._dataConfig.devicesTable);
      const devicesTotal = this._reportService.parseTotals(data.devices.totals, this._dataConfig.devicesTotal);
      const devicesWhitelist = ['Computer', 'Mobile'];
      const colors = { 'Computer': '#487adf', 'Mobile': '#88acf6', 'OTHER': '#dfe9ff' };
      const devicesTotalData = devicesTotal.length ? parseInt(devicesTotal[0].value, 10) : null;
      
      if (devicesTotalData !== null) {
        result.devices = devicesTable.tableData
          .reduce((acc: Object, val: TableRow) => {
            const device = devicesWhitelist.includes(val['device']) ? val['device'] : 'OTHER';
            const plays = parseInt(val['count_plays'], 10);
            const value = devicesTotalData ? plays / devicesTotalData : 0;
            
            if (acc[device]) {
              const otherPlays = acc[device].rawPlays + plays;
              const otherValue = devicesTotalData ? otherPlays / devicesTotalData : 0;
              acc[device].rawPlays = otherPlays;
              acc[device].rawValue = otherValue;
              acc[device].plays = ReportHelper.numberOrZero(otherPlays);
              acc[device].value = ReportHelper.percents(otherValue, false, false, false);
              acc[device].tooltip = this._translate.instant('app.user.playsTooltip', [
                this._translate.instant('app.user.devices.' + device),
                acc[device].plays
              ]);
            } else {
              acc[device] = {
                value: ReportHelper.percents(value, false, false, false),
                plays: ReportHelper.numberOrZero(plays),
                tooltip: this._translate.instant('app.user.playsTooltip', [
                  this._translate.instant('app.user.devices.' + device),
                  ReportHelper.numberOrZero(plays)
                ]),
                rawPlays: plays,
                label: this._translate.instant('app.user.devices.' + device),
                color: colors[device],
                rawValue: value * 100,
                device,
              };
            }
            
            return acc;
          }, {});
      }
    }
  
    return result;
  }
  
  private _handleCompareReportData(current: UserMiniHighlightsReportData, compare: UserMiniHighlightsReportData): void {
    this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM DD, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM DD, YYYY');
    this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM DD, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM DD, YYYY');
  
    const { geo, devices } = this._handleCurrentReportData(current);
    this._geoData = geo;
    this._devicesData = devices;
  
    const { geo: compareGeo, devices: compareDevices } = this._handleCurrentReportData(compare);
    this._compareGeoData = compareGeo;
    this._compareDevicesData = compareDevices;
  }
  
  private _getReport(filter: KalturaEndUserReportInputFilter): Observable<UserMiniHighlightsReportData> {
    const responseOptions: KalturaReportResponseOptions = new KalturaReportResponseOptions({
      delimiter: analyticsConfig.valueSeparator,
      skipEmptyDates: analyticsConfig.skipEmptyBuckets
    });
    
    const geoTableReport = new ReportGetTableAction({
      reportType: reportTypeMap(KalturaReportType.mapOverlayCity),
      reportInputFilter: filter,
      pager: new KalturaFilterPager({ pageSize: 1 }),
      order: '-count_plays',
      responseOptions,
    });
    
    const devicesTableReport = new ReportGetTableAction({
      reportType: reportTypeMap(KalturaReportType.platforms),
      reportInputFilter: filter,
      pager: new KalturaFilterPager({ pageSize: analyticsConfig.defaultPageSize }),
      responseOptions,
    });
    
    const devicesTotalReport = new ReportGetTotalAction({
      reportType: reportTypeMap(KalturaReportType.platforms),
      reportInputFilter: filter,
      responseOptions,
    });
    
    const request = new KalturaMultiRequest(geoTableReport, devicesTableReport, devicesTotalReport);
    
    return this._kalturaClient.multiRequest(request)
      .pipe(map(responses => {
        if (responses.hasErrors()) {
          throw responses.getFirstError();
        }
        
        return {
          geo: { table: responses[0].result },
          devices: { table: responses[1].result, totals: responses[2].result },
        };
      }));
  }
}
