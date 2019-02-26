import { Component, Input } from '@angular/core';
import { KalturaEndUserReportInputFilter, KalturaObjectBaseFactory, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { AuthService, ErrorsManagerService, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { ReportDataConfig } from 'shared/services/storage-data-base.config';
import { TranslateService } from '@ngx-translate/core';
import { TopCountriesConfig } from './top-countries.config';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { EntryBase } from '../entry-base/entry-base';
import { DateFilterComponent } from 'shared/components/date-filter/date-filter.component';

@Component({
  selector: 'app-video-performance',
  templateUrl: './top-countries.component.html',
  styleUrls: ['./top-countries.component.scss'],
  providers: [TopCountriesConfig, ReportService]
})
export class TopCountriesComponent extends EntryBase {
  @Input() entryId = '';
  @Input() dateFilterComponent: DateFilterComponent;
  
  private readonly _order = '-count_plays';
  private _reportType = KalturaReportType.mapOverlayCountry;
  private _dataConfig: ReportDataConfig;
  
  protected _dateFilter: DateChangeEvent;
  protected _componentId = 'top-countries';
  
  public _reportInterval = KalturaReportInterval.days;
  public _compareFilter: KalturaEndUserReportInputFilter = null;
  public _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });
  
  public get _isCompareMode(): boolean {
    return this._compareFilter !== null;
  }
  
  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _compareService: CompareService,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService,
              private _dataConfigService: TopCountriesConfig) {
    super();
    
    this._dataConfig = _dataConfigService.getConfig();
  }
  
  protected _loadReport(sections = this._dataConfig): void {
  
  }
  
  protected _updateRefineFilter(): void {
    this._refineFilterToServerValue(this._filter);
    if (this._compareFilter) {
      this._refineFilterToServerValue(this._compareFilter);
    }
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
}
