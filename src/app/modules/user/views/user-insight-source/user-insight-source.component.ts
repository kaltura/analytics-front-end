import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { BehaviorSubject } from 'rxjs';
import { KalturaAPIException, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaReportInterval, KalturaReportTable } from 'kaltura-ngx-client';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { InsightsBulletValue } from 'shared/components/insights-bullet/insights-bullet.component';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { TranslateService } from '@ngx-translate/core';
import { ErrorsManagerService, ReportService } from 'shared/services';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { UserBase } from '../user-base/user-base';
import { UserInsightSourceConfig } from './user-insight-source.config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import * as moment from 'moment';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { getColorPalette, getColorsBetween, getPrimaryColor } from 'shared/utils/colors';

@Component({
  selector: 'app-user-insight-source',
  templateUrl: './user-insight-source.component.html',
  styleUrls: ['./user-insight-source.component.scss'],
  providers: [UserInsightSourceConfig],
})
export class UserInsightSourceComponent extends UserBase implements OnInit, OnDestroy {
  @Input() dateFilterComponent: DateFilterComponent;
  @Input() isCompare = false;
  @Input() topSources$: BehaviorSubject<{ table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException }>;
  
  protected _componentId = 'insight-top-sources';
  private _dataConfig: ReportDataConfig;
  
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _topSourceLabel = '';
  public _compareTopSourceLabel = '';
  public _reportInterval = KalturaReportInterval.days;
  public _pager = new KalturaFilterPager({ pageSize: 3, pageIndex: 1 });
  public _filter = new KalturaEndUserReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _bulletValues: InsightsBulletValue[] = [];
  public _compareBulletValues: InsightsBulletValue[] = [];
  public _currentDates: string;
  public _compareDates: string;
  public _colors = getColorsBetween(getColorPalette()[0], getColorPalette()[7], 2);
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: UserInsightSourceConfig) {
    super();
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  ngOnInit(): void {
    if (this.topSources$) {
      this.topSources$
        .pipe(cancelOnDestroy(this))
        .subscribe((data: { table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException }) => {
          this._isBusy = data.busy;
          this._blockerMessage = this._errorsManager.getErrorMessage(data.error, {
            'close': () => {
              this._blockerMessage = null;
            }
          });
          
          if (data.table && data.table.header && data.table.data) {
            this._handleTable(data.table, data.compare); // handle table
          }
        });
    }
  }
  
  ngOnDestroy(): void {
  }
  
  protected _loadReport(sections = this._dataConfig): void {
  
  }
  
  protected _updateFilter(): void {
    this._filter.timeZoneOffset = this._dateFilter.timeZoneOffset;
    this._filter.fromDate = this._dateFilter.startDate;
    this._filter.toDate = this._dateFilter.endDate;
    this._filter.interval = this._dateFilter.timeUnits;
    this._reportInterval = this._dateFilter.timeUnits;
  }
  
  protected _updateRefineFilter(): void {
    this._refineFilterToServerValue(this._filter);
  }
  
  private _getTopSource(tableData: TableRow[]): { totalEntries: number, topEntries: number, label: string } {
    let totalEntriesCount = 0;
    let topEntriesCount = 0;
    let topLabel = '';
    
    tableData.forEach(data => {
      const addedEntries = parseInt(data.added_entries);
      totalEntriesCount += addedEntries;
      if (addedEntries > topEntriesCount) {
        topEntriesCount = addedEntries;
        topLabel = data.source;
      }
    });
    
    return {
      totalEntries: totalEntriesCount,
      topEntries: topEntriesCount,
      label: topLabel,
    };
  }
  
  private _handleTable(table: KalturaReportTable, compare?: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    if (tableData) {
      const { totalEntries, topEntries, label } = this._getTopSource(tableData);
      this._topSourceLabel = label;
      this._bulletValues = [
        { value: totalEntries, label: this._topSourceLabel },
        { value: totalEntries - topEntries, label: this._translate.instant('app.contributors.others') },
      ];
      
      if (compare) {
        this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM DD, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.endDate)).format('MMM DD, YYYY');
        this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM DD, YYYY') + ' - ' + moment(DateFilterUtils.fromServerDate(this._dateFilter.compare.endDate)).format('MMM DD, YYYY');
  
        const { tableData: compareTableData } = this._reportService.parseTableData(compare, this._dataConfig.table);
        const {
          totalEntries: compareTotalEntries,
          topEntries: compareTopEntries,
          label: compareLabel
        } = this._getTopSource(compareTableData);

        this._compareTopSourceLabel = compareLabel;
        this._compareBulletValues = [
          { value: compareTotalEntries, label: this._compareTopSourceLabel },
          { value: compareTotalEntries - compareTopEntries, label: this._translate.instant('app.contributors.others') },
        ];
        
      } else {
        this._currentDates = null;
        this._compareDates = null;
      }
    }
  }
  
  public _updateColors(colors: string[]): void {
    this._colors = colors;
  }
}
