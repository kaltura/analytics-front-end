import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService, ReportConfig, ReportHelper, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { DevicesDataConfig } from './devices-data.config';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { DateRanges } from 'shared/components/date-filter/date-filter-utils';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { significantDigits } from 'shared/utils/significant-digits';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { parseFormattedValue } from 'shared/utils/parse-fomated-value';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { VEBaseReportComponent } from "../ve-base-report/ve-base-report.component";
import { DeviceIconPipe } from "shared/pipes/device-icon.pipe";

@Component({
  selector: 'app-ve-devices',
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
  providers: [
    DevicesDataConfig,
    KalturaLogger.createLogger('VEDevicesComponent')
  ]
})
export class VEDevicesComponent extends VEBaseReportComponent implements OnInit, OnDestroy {
  @Input() virtualEventId = '';
  @Input() exporting = false;

  protected _componentId = 've-devices';
  private _dataConfig: ReportDataConfig;
  private _pager: KalturaFilterPager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });

  private _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  private _reportType: KalturaReportType = reportTypeMap(KalturaReportType.veRegisteredPlatforms);
  private order = '-registered_unique_users';

  public _reportInterval: KalturaReportInterval = KalturaReportInterval.days;
  public _dateRange = DateRanges.Last30D;
  public _tableData: TableRow<any>[] = [];
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = [];

  private _deviceIconPipe = new DeviceIconPipe();

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _dataConfigService: DevicesDataConfig,
              private _logger: KalturaLogger) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }

  ngOnInit() {
    this._isBusy = false;
  }

  ngOnDestroy() {
  }

  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
    this._pager.pageIndex = 1;
  }

  protected _updateRefineFilter(): void {
    this._pager.pageIndex = 1;
    refineFilterToServerValue(this._refineFilter, this._filter);
  }

  protected _loadReport(sections = this._dataConfig): void {
    this._isBusy = true;
    this._tableData = [];
    this._blockerMessage = null;
    if (this.virtualEventId) {
      this._filter.virtualEventIdIn = this.virtualEventId;
    }
    const reportConfig: ReportConfig = { reportType: this._reportType, filter: this._filter, pager: this._pager, order: this.order };
    this._reportService.getReport(reportConfig, sections, false)
      .pipe(cancelOnDestroy(this))
      .subscribe((report) => {
          if (report.table && report.table.header && report.table.data) {
            this._handleTable(report.table); // handle table
          }
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

  private _handleTable(table: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);

    // use local total as the unique viewers total is not accurate
    let total = 0;
    for (let i = 0; i < tableData.length; i++) {
      total += parseInt(tableData[i]['registered_unique_users']);
    }
    this._tableData = tableData.map((row, index) => {
      const calculateDistribution = (key: string): number => {
        const rowValue = parseFormattedValue(row[key]);
        return significantDigits((rowValue / total) * 100);
      };
      const registrationDistribution = calculateDistribution('registered_unique_users');
      row['distribution'] = "0"; // to trigger css animation we set the correct value after a timeout
      setTimeout(() => {
        row['distribution'] = ReportHelper.numberWithCommas(registrationDistribution);
      });
      row['icon'] = this._deviceIconPipe.transform(row.device);

      return row;
    });
  }

}
