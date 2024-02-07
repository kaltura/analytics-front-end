import { Component, Input, OnDestroy, ViewChild } from '@angular/core';
import { AppAnalytics, AuthService, BrowserService } from 'shared/services';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { KalturaClient, KalturaEndUserReportInputFilter, KalturaObjectBaseFactory, KalturaPager, KalturaReportExportItem, KalturaReportExportParams, KalturaReportResponseOptions, ReportExportToCsvAction} from 'kaltura-ngx-client';
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
import { KalturaLogger } from "@kaltura-ng/kaltura-logger";
import { isEmptyObject } from "shared/utils/is-empty-object";

@Component({
  selector: 'app-export-csv',
  templateUrl: './export-csv.component.html',
  styleUrls: ['./export-csv.component.scss'],
  providers: [KalturaLogger.createLogger('ExportCSV')]
})
export class ExportCsvComponent implements OnDestroy {
  @Input() name = 'default';
  @Input() dateFilter: DateChangeEvent = null;
  @Input() refineFilter: RefineFilter = [];
  @Input() pager: KalturaPager = null;
  @Input() entryId: string = null;
  @Input() categoryId: string = null;
  @Input() virtualEventId: string = null;
  @Input() playlistId: string = null;
  @Input() rootEntryIdIn: string = null;
  @Input() userId: string = null;
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

  constructor(private _authService: AuthService,
              private _translate: TranslateService,
              private _browserService: BrowserService,
              private _analytics: AppAnalytics,
              private _logger: KalturaLogger,
              private _kalturaClient: KalturaClient) {
  }

  ngOnDestroy(): void {
  }

  private _focusSelectAll(): void {
    setTimeout(() => {
      const node = document.querySelector('.kExportPanel .p-treenode-content') as HTMLElement;
      if (node) {
        node.focus();
      }
    });
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

    if (this.categoryId && !filter.categoriesIdsIn && !filter.playbackContextIdsIn) {
      filter.categoriesIdsIn = this.categoryId;
    }

    if (this.playlistId) {
      filter.playlistIdIn = this.playlistId;
    }

    if (this.rootEntryIdIn) {
      filter.rootEntryIdIn = this.rootEntryIdIn;
    }

    if (this.userId) {
      filter.userIds = this.userId;
    }

    if (analyticsConfig.predefinedFilter !== null && !isEmptyObject(analyticsConfig.predefinedFilter)) {
      Object.keys(analyticsConfig.predefinedFilter).forEach(key => {
        filter[key] = analyticsConfig.predefinedFilter[key]; // override filter value
      });
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
        styleClass: report.id === 'groupNode' ? 'groupNode' : '',
        selectable: report.id !== 'groupNode',
      })),
    }];
  }

  public _onPopupOpen(): void {
    this._opened = true;
    this._selected = [];
    this._focusSelectAll();
  }

  public _onPopupClose(): void {
    this._opened = false;
    this._selected = [];

    if (this._options[0]) {
      this._options[0].partialSelected = false;
    }
  }

  public _export(selected = [], additionalFilters = null): void {
    const doExport = () => {
      if (!this._selected.length && selected.length) { // allow external override of selection
        this._selected = selected;
      }
      if (!this._selected.length) {
        return;
      }

      const timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
      const reportsItemsGroup = this.name;
      const reportItems = [];
      let filter = this._getFilter();
      if (additionalFilters) {
        filter = Object.assign(filter, additionalFilters);
      }
      const responseOptions = new KalturaReportResponseOptions({
        delimiter: analyticsConfig.valueSeparator,
        skipEmptyDates: analyticsConfig.skipEmptyBuckets
      });
      const selection: ExportItem[] = this._selected
        .filter(({ parent, data }) => !!parent && data.id !== 'groupNode')
        .map(({ data }) => data);

      const mapReportItem = (item, label = null) => {
        const itemFilter = Object.assign(KalturaObjectBaseFactory.createObject(filter), filter);
        if (item.startDate && item.endDate) {
          itemFilter.fromDate = typeof item.startDate === 'function' ? item.startDate() : item.startDate;
          itemFilter.toDate = typeof item.endDate === 'function' ? item.endDate() : item.endDate;
        }
        if (item.ownerId) {
          itemFilter.ownerIdsIn = item.ownerId;
          delete itemFilter.userIds;
        }
        item.sections.forEach(section => {
          const reportItem = new KalturaReportExportItem({
            reportTitle: label || item.label,
            action: section,
            reportType: item.reportType,
            filter: itemFilter,
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

      let baseUrl = '';
      try {
        const origin = window.parent && window.parent.location && window.parent.location.origin ? window.parent.location.origin : window.location.origin;
        const isKMC = window.parent && typeof window.parent['kmcng'] === 'object';
        const exportRoute = analyticsConfig.kalturaServer.exportRoute ? analyticsConfig.kalturaServer.exportRoute : isKMC ? '/index.php/kmcng/analytics/export?id=' : '/userreports/downloadreport?report_id=';
        baseUrl = encodeURIComponent(`${origin}${exportRoute}`);
      } catch (e) {
        this._logger.error('Error accessing parent window location', e);
      }

      const exportAction = new ReportExportToCsvAction({ params: new KalturaReportExportParams({ timeZoneOffset, reportsItemsGroup, reportItems, baseUrl }) });

      this._analytics.trackClickEvent('Export');
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
            // this._browserService.alert({
            //   header: this._translate.instant('app.exportReports.exportReports'),
            //   message: this._translate.instant('app.exportReports.successMessage'),
            // });
          },
          () => {
            this._browserService.alert({
              header: this._translate.instant('app.exportReports.exportReports'),
              message: this._translate.instant('app.exportReports.errorMessage'),
            });
          });
    };

    this._browserService.confirm(
      {
        header: this._translate.instant('app.exportReports.title'),
        message: this._authService.email ? this._translate.instant('app.exportReports.withEmail', {emailAddress: this._authService.email}) : this._translate.instant('app.exportReports.withoutEmail'),
        acceptLabel: this._translate.instant('app.exportReports.approve'),
        rejectLabel: this._translate.instant('app.common.cancel'),
        accept: () => {
          doExport();
        }
      });
  }
  public toggleDropdown() {
    if (this._popup) {
      this._popup.toggle();
      this._focusSelectAll();
    }
  }
}
