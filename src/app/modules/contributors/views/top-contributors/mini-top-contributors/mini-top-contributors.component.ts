import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { PageScrollConfig, PageScrollInstance, PageScrollService } from 'ngx-page-scroll';
import { KalturaAPIException, KalturaReportTable, KalturaReportType } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { AuthService, ErrorsManagerService, ReportService } from 'shared/services';
import { BehaviorSubject } from 'rxjs';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { analyticsConfig } from 'configuration/analytics-config';
import { MiniTopContributorsConfig } from './mini-top-contributors.config';
import { TopContributorsBaseReportComponent } from '../top-contributors-base-report/top-contributors-base-report.component';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'app-contributors-mini-top-contributors',
  templateUrl: './mini-top-contributors.component.html',
  styleUrls: ['./mini-top-contributors.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniTopContributorsComponent'),
    MiniTopContributorsConfig,
    ReportService,
  ]
})
export class MiniTopContributorsComponent extends TopContributorsBaseReportComponent implements OnInit, OnDestroy {
  @Input() dateFilterComponent: DateFilterComponent;
  @Input() topContributors$: BehaviorSubject<{ table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException }>;

  private _dataConfig: ReportDataConfig;
  
  protected _componentId = 'mini-top-contributors';
  
  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _tableData: TableRow<string>[] = [];
  public _compareTableData: TableRow<string>[] = [];
  public _compareFirstTimeLoading = true;
  public _currentDates: string;
  public _compareDates: string;
  public _isCompareMode = false;
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _pageScrollService: PageScrollService,
              private _dataConfigService: MiniTopContributorsConfig,
              private _logger: KalturaLogger) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  ngOnInit(): void {
    if (this.topContributors$) {
      this.topContributors$
        .pipe(cancelOnDestroy(this))
        .subscribe((data: { table: KalturaReportTable, compare: KalturaReportTable, busy: boolean, error: KalturaAPIException }) => {
          this._tableData = [];
          this._blockerMessage = this._errorsManager.getErrorMessage(data.error, {
            'close': () => {
              this._blockerMessage = null;
            }
          });
          this._compareTableData = [];
          if (data.table && data.table.header && data.table.data) {
            this._handleTable(data.table, data.compare); // handle table
          }
          this._isBusy = data.busy;
        });
    }
  }
  
  ngOnDestroy(): void {
  
  }
  
  protected _updateRefineFilter(): void {
  }
  
  protected _loadReport(): void {
  }
  
  protected _updateFilter(): void {
    this._isCompareMode = this._dateFilter.compare.active;
  }
  
  private _handleTable(table: KalturaReportTable, compareTable?: KalturaReportTable): void {
    const { tableData } = this._reportService.parseTableData(table, this._dataConfig.table);
    const extendTableRow = (item, index) => {
      (<any>item)['index'] = index + 1;
      return item;
    };
    this._tableData = tableData.map(extendTableRow).splice(0, 3);
    this._currentDates = null;
    this._compareDates = null;
    this.setAnonymousContributors(this._tableData); // fix for anonymous users
    
    if (compareTable && compareTable.header && compareTable.data) {
      const { tableData: compareTableData } = this._reportService.parseTableData(compareTable, this._dataConfig.table);
      this._compareTableData = compareTableData.map(extendTableRow);
      this._compareFirstTimeLoading = false;
      this._currentDates = DateFilterUtils.getMomentDate(this._dateFilter.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.endDate).format('MMM D, YYYY');
      this._compareDates = DateFilterUtils.getMomentDate(this._dateFilter.compare.startDate).format('MMM D, YYYY') + ' - ' + DateFilterUtils.getMomentDate(this._dateFilter.compare.endDate).format('MMM D, YYYY');
      this.setAnonymousContributors(this._compareTableData); // fix for anonymous users
    }
  }
  
  public _scrollTo(target: string): void {
    this._logger.trace('Handle scroll to details report action by user', { target });
    if (analyticsConfig.isHosted) {
      const targetEl = document.getElementById(target.substr(1)) as HTMLElement;
      if (targetEl) {
        const menuOffset = 50; // contributors page doesn't have sub menu, subtract menu offset for correct scroll
        this._frameEventManager.publish(FrameEvents.ScrollTo, targetEl.offsetTop - menuOffset);
      }
    } else {
      PageScrollConfig.defaultDuration = 500;
      const pageScrollInstance: PageScrollInstance = PageScrollInstance.simpleInstance(document, target);
      this._pageScrollService.start(pageScrollInstance);
    }
  }

  private setAnonymousContributors(contributors: TableRow<string>[]): void {
    contributors.forEach( contributor => {
      if ( !contributor['creator_name'].length ) {
        contributor['creator_name'] = 'anonymous';
        contributor['created_at'] = '';
      }
    });
  }
}
