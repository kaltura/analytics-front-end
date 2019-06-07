import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { BrowserService, ReportService } from 'shared/services';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { KalturaClient, KalturaEndUserReportInputFilter, KalturaPager, KalturaReportExportItem, KalturaReportExportParams, KalturaReportResponseOptions, ReportExportToCsvAction } from 'kaltura-ngx-client';
import { TreeNode } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { PopupWidgetComponent } from '@kaltura-ng/kaltura-ui';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { refineFilterToServerValue } from 'shared/components/filter/filter-to-server-value.util';
import { analyticsConfig } from 'configuration/analytics-config';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { finalize } from 'rxjs/operators';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';

@Component({
  selector: 'app-export-csv',
  templateUrl: './export-csv.component.html',
  styleUrls: ['./export-csv.component.scss'],
})
export class ExportCsvComponent implements OnDestroy {
  @Input() name = 'default';
  @Input() dateFilter: DateChangeEvent = null;
  @Input() refineFilter: RefineFilter = [];
  @Input() pager: KalturaPager = null;
  @Input() entryId: string = null;
  @Input() width = 240;
  
  @Input() set reports(value: ExportItem[]) {
    if (Array.isArray(value)) {
      this._showComponent = true;
      
      if (value.length > 1) { // show dropdown
        this._singleMode = false;
        this._options = this._getNodes(value);
      } else if (value.length === 1) { // show button
        this._singleMode = true;
        this._selected = [{
          parent: {},
          data: value[0],
        }];
      }
    } else {
      this._showComponent = false;
    }
  }
  
  @ViewChild('popupWidgetComponent') _popup: PopupWidgetComponent;
  
  public _opened = false;
  public _options: TreeNode[] = [];
  public _selected: TreeNode[] = [];
  public _singleMode = false;
  public _showComponent = false;
  public _exportingCsv = false;
  
  constructor(private _reportService: ReportService,
              private _translate: TranslateService,
              private _browserService: BrowserService,
              private _kalturaClient: KalturaClient) {
  }
  
  ngOnDestroy(): void {
  }
  
  private _getFilter(): KalturaEndUserReportInputFilter {
    let filter = new KalturaEndUserReportInputFilter();
    
    if (this.dateFilter) {
      filter.timeZoneOffset = this.dateFilter.timeZoneOffset;
      filter.fromDate = this.dateFilter.startDate;
      filter.toDate = this.dateFilter.endDate;
      filter.interval = this.dateFilter.timeUnits;
    }
    
    if (this.refineFilter) {
      refineFilterToServerValue(this.refineFilter, filter);
    }
    
    if (this.entryId) {
      filter.entryIdIn = this.entryId;
    }
    
    return filter;
  }
  
  private _getNodes(reports: ExportItem[]): TreeNode[] {
    return [{
      label: this._translate.instant('app.common.all'),
      expanded: true,
      partialSelected: false,
      children: reports.map(report => ({
        label: report.label,
        data: report,
      })),
    }];
  }
  
  public _onPopupClose(): void {
    this._opened = false;
    this._selected = [];
    
    if (this._options[0]) {
      this._options[0].partialSelected = false;
    }
  }
  
  public _export(): void {
    if (!this._selected.length) {
      return;
    }
    
    const timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
    const reportItems = [];
    const filter = this._getFilter();
    const responseOptions = new KalturaReportResponseOptions({
      delimiter: analyticsConfig.valueSeparator,
      skipEmptyDates: analyticsConfig.skipEmptyBuckets
    });
    const selection: ExportItem[] = this._selected
      .filter(({ parent }) => !!parent)
      .map(({ data }) => data);
  
    const mapReportItem = (item, label = null) => {
      if (item.startDate && item.endDate) {
        filter.fromDate = typeof item.startDate === 'function' ? item.startDate() : item.startDate;
        filter.toDate = typeof item.endDate === 'function' ? item.endDate() : item.endDate;
      }
      item.sections.forEach(section => {
        const reportItem = new KalturaReportExportItem({
          reportTitle: label || item.label,
          action: section,
          reportType: item.reportType,
          filter,
          responseOptions,
        });
    
        if (item.order) {
          reportItem.order = item.order;
        }
    
        if (item.objectIds) {
          reportItem.objectIds = item.objectIds;
        }
    
        if (item.additionalFilters) {
          Object.keys(item.additionalFilters).forEach(key => {
            reportItem.filter[key] = item.additionalFilters[key];
          });
        }
    
        reportItems.push(reportItem);
      });
    };
    
    selection.forEach(item => {
      if (Array.isArray(item.items)) {
        item.items.forEach(i => mapReportItem(i, item.label));
      } else {
        mapReportItem(item);
      }
    });
    
    const exportAction = new ReportExportToCsvAction({ params: new KalturaReportExportParams({ timeZoneOffset, reportItems }) });
    
    this._exportingCsv = true;
    
    this._kalturaClient.request(exportAction)
      .pipe(
        cancelOnDestroy(this),
        finalize(() => {
          this._exportingCsv = false;

          if (this._popup) {
            this._popup.close();
          }
        })
      )
      .subscribe(
        () => {
          this._browserService.alert({
            header: this._translate.instant('app.exportReports.exportReports'),
            message: this._translate.instant('app.exportReports.successMessage'),
          });
        },
        () => {
          this._browserService.alert({
            header: this._translate.instant('app.exportReports.exportReports'),
            message: this._translate.instant('app.exportReports.errorMessage'),
          });
        });
  }
}
