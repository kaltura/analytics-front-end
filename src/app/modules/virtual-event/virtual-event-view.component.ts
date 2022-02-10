import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  KalturaClient,
  KalturaDetachedResponseProfile,
  KalturaReportInterval,
  KalturaReportType,
  KalturaResponseProfileType, KalturaVirtualEvent, VirtualEventGetAction
} from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { BrowserService, ErrorsManagerService, NavigationDrillDownService } from 'shared/services';
import { ViewConfig } from "configuration/view-config";
import { DateChangeEvent } from "shared/components/date-filter/date-filter.service";
import { analyticsConfig } from "configuration/analytics-config";
import {DateFilterUtils, DateRanges} from "shared/components/date-filter/date-filter-utils";
import { ExportItem } from "shared/components/export-csv/export-config-base.service";
import { RefineFilter } from "shared/components/filter/filter.component";
import { VirtualEventExportConfig } from "./virtual-event-export.config";
import { FrameEventManagerService } from "shared/modules/frame-event-manager/frame-event-manager.service";
import { ExportCsvComponent } from "shared/components/export-csv/export-csv.component";
import * as moment from "moment";
import * as html2pdf from "html2pdf.js";
import {TranslateService} from "@ngx-translate/core";
import {reportTypeMap} from "shared/utils/report-type-map";
import {ReportDataSection} from "shared/services/storage-data-base.config";
import {getPrimaryColor, getSecondaryColor} from "shared/utils/colors";

@Component({
  selector: 'app-virtual-event',
  templateUrl: './virtual-event-view.component.html',
  styleUrls: ['./virtual-event-view.component.scss'],
  providers: [VirtualEventExportConfig]
})
export class VirtualEventViewComponent implements OnInit, OnDestroy {

  @ViewChild('export', {static: true}) export: ExportCsvComponent;

  public _selectedRefineFilters: RefineFilter = null;
  public _viewConfig: ViewConfig =  analyticsConfig.viewsConfig.virtualEvent;
  public _dateRange = DateRanges.SinceCreation;
  public _timeUnit = KalturaReportInterval.days;
  public _virtualEventDateLabel = '';
  public _creationDate: moment.Moment = null;
  public _updateDate = '';
  public _dateFilter: DateChangeEvent = null;
  public _exportConfig: ExportItem[] = [];
  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  public _loadingVirtualEvent = false;
  public _virtualEventLoaded = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _virtualEvent: KalturaVirtualEvent;
  public _virtualEventId = null;
  public _devicesReportType = reportTypeMap(KalturaReportType.veRegisteredPlatforms)
  public _creationDateLabels = {label: null, prefix: null};
  public _unregistered = 0;
  public _exporting = false;
  public _devicesReportConfig = {
    [ReportDataSection.table]: {
      fields: {
        'device': {
          format: value => value,
        },
        'registered': {
          format: value => value,
        }
      }
    },
    [ReportDataSection.totals]: {
      preSelected: 'registered',
      fields: {
        'registered': {
          format: value => value,
          title: this._translate.instant(`app.ve.registered`),
          sortOrder: 1,
          colors: [getPrimaryColor(), getSecondaryColor()],
        }
      }
    }
  };

  constructor(private _router: Router,
              private _translate: TranslateService,
              private _route: ActivatedRoute,
              private _kalturaClient: KalturaClient,
              private _browserService: BrowserService,
              private _errorsManager: ErrorsManagerService,
              private _exportConfigService: VirtualEventExportConfig,
              private _frameEventManager: FrameEventManagerService,
              private _navigationDrillDownService: NavigationDrillDownService) {
    this._creationDateLabels = {label: this._translate.instant('app.dateFilter.publish'), prefix: this._translate.instant('app.dateFilter.sincePublish')};
  }

  ngOnInit() {
    this._exportConfig = this._exportConfigService.getConfig(this._viewConfig);
    this._route.params
      .pipe(cancelOnDestroy(this))
      .subscribe(params => {
        this._virtualEventId = params['id'];
        if (this._virtualEventId) {
          this._loadVirtualEventDetails();
        }
      });
  }

  ngOnDestroy() {
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }

  private _loadVirtualEventDetails(parentCategory = false): void {
    this._loadingVirtualEvent = true;
    this._virtualEventLoaded = false;
    this._blockerMessage = null;

    const request = new VirtualEventGetAction({ id: this._virtualEventId })
        .setRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
            type: KalturaResponseProfileType.includeFields,
            fields: 'id,name,createdAt,updatedAt'
          })
        });

    this._kalturaClient
      .request(request)
      .pipe(cancelOnDestroy(this))
      .subscribe(
        (virtualEvent: KalturaVirtualEvent) => {
          this._virtualEventLoaded = true;
          this._virtualEvent = virtualEvent;
          const dateFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
          this._virtualEventDateLabel = DateFilterUtils.getMomentDate(virtualEvent.createdAt).format(dateFormat);
          this._creationDate = DateFilterUtils.getMomentDate(virtualEvent.createdAt);
          this._updateDate = DateFilterUtils.getMomentDate(virtualEvent.updatedAt).format(dateFormat);
          this._loadingVirtualEvent = false;
        },
        error => {
          this._loadingVirtualEvent = false;
          this._virtualEventLoaded = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadVirtualEventDetails();
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  public onRegistrationDataLoaded(event: { unregistered: number }): void {
    this._unregistered = event.unregistered;
  }

  public exportReport(event: { type: string, id: string }): void {
    this.export._export([{
      parent: true,
      data: {
        id: "performance",
        label: "Media Engagement",
        order: "-count_loads",
        reportType: "13",
        sections: [1]
      }
    }], { entryIdIn: event.id });
  }

  public _back(): void {
    this._navigationDrillDownService.navigateBack('audience/engagement', true);
  }

  public downloadReport(el: any): void {
    this._exporting = true;
    let updateTitle = this._viewConfig.title === null; // need to temporarily display the title for the export
    let updateDetails = this._viewConfig.details === null; // need to temporarily display the details for the export
    if (updateTitle) {
      this._viewConfig.title = {};
    }
    if (updateDetails) {
      this._viewConfig.details = {};
    }
    this._viewConfig.refineFilter = null; // hide refine filter
    this._viewConfig.download = null; // hide download report button
    var element = document.getElementById('reportToExport');
    element.style.paddingLeft = 10 + 'px';
    element.style.width = 1600 + 'px';
    const originalHeight = element.style.width;
    element.style.height = '2314px';
    // use a timeout to refresh the page binding
    setTimeout(() => {
      // element.style.backgroundColor = '#f2f2f2';
      var opt = {
        margin:       0,
        pagebreak:    { before: '.breakBefore',after: '.breakAfter'},
        filename:     `Summary_registration_report_${this._virtualEventId}.pdf`,
        image:        { type: 'jpeg', quality: 0.95 },
        html2canvas:  { width: element.clientWidth + 40, useCORS: false, dpi: 150, scale: 2 },
        jsPDF:        { units: 'px', orientation: 'portrait' }
      };
      html2pdf(element, opt);
      setTimeout(() => {
        element.style.paddingLeft = null;
        element.style.width = '100%';
        element.style.height = originalHeight + 'px';
        // element.style.backgroundColor = null;
        if (updateTitle) {
          this._viewConfig.title = null;
        }
        if (updateDetails) {
          this._viewConfig.details = null;
        }
        this._viewConfig.refineFilter = {
          origin: {},
          geo: {}
        };
        this._viewConfig.download = {};
        setTimeout(() => {
          this._exporting = false;
        }, 500);
      },0);
    }, 1000);



  }

}
