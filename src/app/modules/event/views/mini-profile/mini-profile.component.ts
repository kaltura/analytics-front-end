import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {analyticsConfig} from "configuration/analytics-config";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";
import {Router} from "@angular/router";
import {OverlayPanel} from "primeng/overlaypanel";
import {ErrorsManagerService, ReportConfig, ReportHelper, ReportService} from "shared/services";
import {
  KalturaAPIException,
  KalturaClient,
  KalturaEndUserReportInputFilter,
  KalturaFilterPager,
  KalturaMultiResponse,
  KalturaReportInterval,
  KalturaReportResponseOptions, KalturaReportTable,
  KalturaReportType,
  ReportGetTableAction,
  ReportGetTotalAction
} from "kaltura-ngx-client";
import {MiniProfileConfig} from "./mini-profile.config";
import {ReportDataConfig, ReportDataItemConfig} from "shared/services/storage-data-base.config";
import {AreaBlockerMessage} from "@kaltura-ng/kaltura-ui";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";

export type Profile = {
  id: number;
  metric: string; // 'company' | 'role' | 'industry' | 'country';
  label: string;
  percent: number;
  rate: number;
};

@Component({
  selector: 'app-event-mini-profile',
  templateUrl: './mini-profile.component.html',
  styleUrls: ['./mini-profile.component.scss'],
  providers: [
    KalturaLogger.createLogger('MiniProfileComponent'),
    MiniProfileConfig,
    ReportService
  ]
})

export class MiniProfileComponent implements OnInit, OnDestroy {

  protected _componentId = 'event-mini-profile';

  @Input() eventStartDate: Date;
  @Input() eventEndDate: Date;
  @Input() eventIn = '';
  @Input() set virtualEventLoaded(value: boolean) {
    if (value === true) {
      // use timeout to allow data binding to finish
      setTimeout(() => {
        this._loadReport();
      }, 0);
    }
  }
  @ViewChild('overlay') _overlay: OverlayPanel;

  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage = null;

  public _profiles: Profile[] = [];
  public _currentProfile: Profile = null;

  private _pager = new KalturaFilterPager({ pageSize: 3, pageIndex: 1 });
  private _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  private _totalRegistered = 0;

  constructor(private _frameEventManager: FrameEventManagerService,
              private _router: Router,
              private _reportService: ReportService,
              private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService,
              private _dataConfigService: MiniProfileConfig) {
  }

  ngOnInit(): void {
  }

  private _loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    this._filter.virtualEventIdIn = this.eventIn;
    this._filter.timeZoneOffset = DateFilterUtils.getTimeZoneOffset();
    this._filter.fromDate = Math.floor(this.eventStartDate.getTime() / 1000);
    this._filter.toDate = Math.floor(this.eventEndDate.getTime() / 1000);
    this._filter.interval = KalturaReportInterval.days;
    const responseOptions = new KalturaReportResponseOptions({
      delimiter: analyticsConfig.valueSeparator,
      skipEmptyDates: analyticsConfig.skipEmptyBuckets
    });

    const totalsReportRequest = new ReportGetTotalAction({
      reportType: KalturaReportType.veRegisteredCountries,
      reportInputFilter: this._filter,
      responseOptions
    });
    const countriesReportRequest = new ReportGetTableAction({
      reportType: KalturaReportType.veRegisteredCountries,
      reportInputFilter: this._filter,
      order: '-registered_unique_users',
      pager: this._pager,
      responseOptions
    });
    const rolesReportRequest = new ReportGetTableAction({
      reportType: KalturaReportType.veRegisteredRoles,
      reportInputFilter: this._filter,
      order: '-registered_unique_users',
      pager: this._pager,
      responseOptions
    });
    const industriesReportRequest = new ReportGetTableAction({
      reportType: KalturaReportType.veRegisteredIndustry,
      reportInputFilter: this._filter,
      order: '-registered_unique_users',
      pager: this._pager,
      responseOptions
    });

    this._kalturaClient
      .multiRequest([totalsReportRequest, countriesReportRequest, rolesReportRequest, industriesReportRequest])
      .pipe(cancelOnDestroy(this))
      .subscribe((responses: KalturaMultiResponse) => {
          if (responses.hasErrors()) {
            this.displayServerError(responses.getFirstError(), () => this._loadReport());
          }
          this._profiles = [];
          const totals = responses[0]?.result || null;
          const totalsConfig = this._dataConfigService.getConfig().totals;
          const totalTabs = this._reportService.parseTotals(totals, totalsConfig);
          if (totalTabs.length) {
            this._totalRegistered = this._reportService.parseTotals(totals, totalsConfig)[0].rawValue as number;
          }
          if (this._totalRegistered > 0) {
            const addToProfiles = (table: KalturaReportTable, config: ReportDataItemConfig, metric: string) => {
              let data = this._reportService.parseTableData(table, config).tableData;
              if (data?.length) {
                data = data.filter(data => data[metric] !== "Unknown");
                if (data.length > 3) {
                  data.length = 0;
                }
                data.forEach((data, index) => {
                  this._profiles.push({
                    id: index,
                    metric,
                    label: data[metric],
                    rate: -1,
                    percent: ReportHelper.precisionRound(parseInt(data.registered_unique_users) / this._totalRegistered * 100, 1)
                  });
                });
              }
            };

            const countries = responses[1]?.result || null;
            const countriesConfig = this._dataConfigService.getCountriesConfig().table;
            addToProfiles(countries, countriesConfig, 'country');

            const roles = responses[2]?.result || null;
            const rolesConfig = this._dataConfigService.getRolesConfig().table;
            addToProfiles(roles, rolesConfig, 'role');

            const industries = responses[3]?.result || null;
            const industriesConfig = this._dataConfigService.getIndustriesConfig().table;
            addToProfiles(industries, industriesConfig, 'industry');
          }

          this._isBusy = false;
        },
        error => {
          this._isBusy = false;
          this.displayServerError(error, () => this._loadReport());
        });
  }

  private displayServerError(error: KalturaAPIException, retryFunction: Function): void {
    const actions = {
      'close': () => {
        this._blockerMessage = null;
      },
      'retry': () => {
        retryFunction();
      },
    };
    this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
  }

  private shuffle = (array: Profile[]) => {
    // Fisher-Yates Sorting Algorithm
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  public _showOverlay(event: any, profile: Profile): void {
    if (this._overlay) {
      this._currentProfile = profile;
      this._overlay.show(event);
    }
  }

  public _hideOverlay(): void {
    if (this._overlay) {
      this._currentProfile = null;
      this._overlay.hide();
    }
  }

  public breakdown(): void {
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.NavigateTo, `/analytics/virtual-event/${this.eventIn}`);
    } else {
      this._router.navigate([`/virtual-event/${this.eventIn}`]);
    }
  }

  ngOnDestroy(): void {
  }

}
