import { Component } from '@angular/core';
import { DateChangeEvent, DateRanges } from 'shared/components/date-filter/date-filter.service';
import { KalturaEndUserReportInputFilter, KalturaReportType } from 'kaltura-ngx-client';
import { RefineChangeEvent } from './filter/filter.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-engagement',
  templateUrl: './engagement.component.html',
  styleUrls: ['./engagement.component.scss']
})
export class EngagementComponent {
  public _selectedRefineFilters: RefineChangeEvent = null;
  public _tags: { label: string, value: string }[] = [];
  public _dateRange = DateRanges.CurrentYear;
  public _csvExportHeaders = '';
  public _totalCount: number;
  public _reportType: KalturaReportType = KalturaReportType.userUsage;
  public _selectedMetrics: string;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineChangeEvent = null;
  public _filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  
  constructor(private _translate: TranslateService) {
  
  }
  
  
  private _updateTags(): void {
    this._tags = [
      ...this._refineFilter.mediaTypes.map(value => ({
        value,
        label: this._translate.instant(`app.filters.${value}`),
        type: 'mediaType'
      })),
      ...this._refineFilter.deviceTypes.map(value => ({
        value,
        label: this._translate.instant(`app.filters.${value}`),
        type: 'deviceTypes'
      })),
    ];
  }
  
  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }
  
  public _onRefineFilterChange(event: RefineChangeEvent): void {
    this._refineFilter = event;
    this._updateTags();
  }
  
  public _onRemoveTag(item: { value: string, label: string, type: string }): void {
    this._selectedRefineFilters = Object.assign(
      {},
      this._refineFilter,
      item.type === 'mediaType'
        ? { mediaTypes: this._refineFilter.mediaTypes.filter(value => item.value !== value) }
        : { deviceTypes: this._refineFilter.deviceTypes.filter(value => item.value !== value) }
    );
    this._updateTags();
  }
  
  public _onRemoveAllTags(): void {
    this._selectedRefineFilters = { mediaTypes: [], deviceTypes: [] };
    this._updateTags();
  }
}
