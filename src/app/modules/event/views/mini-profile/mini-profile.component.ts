import {Component, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {KalturaLogger} from '@kaltura-ng/kaltura-logger';
import {analyticsConfig} from "configuration/analytics-config";
import {FrameEventManagerService, FrameEvents} from "shared/modules/frame-event-manager/frame-event-manager.service";
import {Router} from "@angular/router";
import {OverlayPanel} from "primeng/overlaypanel";
import {AppAnalytics, ButtonType, ErrorsManagerService, NavigationDrillDownService, ReportConfig, ReportHelper, ReportService} from "shared/services";
import {KalturaAPIException, KalturaClient, KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaMultiResponse, KalturaReportInterval, KalturaReportResponseOptions, KalturaReportTable, KalturaReportType, ReportGetTableAction, ReportGetTotalAction} from "kaltura-ngx-client";
import {MiniProfileConfig} from "./mini-profile.config";
import {ReportDataItemConfig} from "shared/services/storage-data-base.config";
import {AreaBlockerMessage} from "@kaltura-ng/kaltura-ui";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";
import {TranslateService} from "@ngx-translate/core";

export type Profile = {
  id: number;
  metric: string; // 'company' | 'role' | 'industry' | 'country';
  label: string;
  percent: number;
  rate: string;
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
  @Input() exporting = false;
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

  constructor(private _router: Router,
              private _analytics: AppAnalytics,
              private _translate: TranslateService,
              private _reportService: ReportService,
              private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService,
              private _navigationDrillDownService: NavigationDrillDownService,
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
    const companiesReportRequest = new ReportGetTableAction({
      reportType: KalturaReportType.veRegisteredCompanies,
      reportInputFilter: this._filter,
      order: '-registered_unique_users',
      pager: this._pager,
      responseOptions
    });

    let counter = 0;
    this._kalturaClient
      .multiRequest([totalsReportRequest, countriesReportRequest, rolesReportRequest, industriesReportRequest, companiesReportRequest])
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
                if (data.length > 4) {
                  data.length = 0;
                }
                data.forEach((data, index) => {
                  this._profiles.push({
                    id: counter,
                    metric,
                    label: data[metric],
                    rate: 'notLoaded',
                    percent: ReportHelper.precisionRound(parseInt(data.registered_unique_users) / this._totalRegistered * 100, 1)
                  });
                  counter++;
                });
              }
            };

            const countries = responses[1]?.result || null;
            const countriesConfig = this._dataConfigService.getCountriesConfig().table;
            if (countries?.header?.length) {
              addToProfiles(countries, countriesConfig, 'country');
            }

            const roles = responses[2]?.result || null;
            const rolesConfig = this._dataConfigService.getRolesConfig().table;
            if (roles?.header?.length) {
              addToProfiles(roles, rolesConfig, 'role');
            }

            const industries = responses[3]?.result || null;
            const industriesConfig = this._dataConfigService.getIndustriesConfig().table;
            if (industries?.header?.length) {
              addToProfiles(industries, industriesConfig, 'industry');
            }

            const companies = responses[4]?.result || null;
            const companiesConfig = this._dataConfigService.getCompaniesConfig().table;
            if (companies?.header?.length) {
              addToProfiles(companies, companiesConfig, 'company');
            }
          }

          this._isBusy = false;
          this._profiles = this.shuffle(this._profiles);
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

  private loadAttendanceRate(profile: Profile): void {
    const filter = new KalturaEndUserReportInputFilter({
      searchInTags: true,
      searchInAdminTags: false,
      virtualEventIdIn: this.eventIn,
      timeZoneOffset: DateFilterUtils.getTimeZoneOffset(),
      fromDate: Math.floor(this.eventStartDate.getTime() / 1000),
      toDate: Math.floor(this.eventEndDate.getTime() / 1000),
      interval: KalturaReportInterval.days
    });

    if (profile.metric === 'role') {
      filter.roleIn = profile.label;
    }
    if (profile.metric === 'industry') {
      filter.industryIn = profile.label;
    }
    if (profile.metric === 'country') {
      filter.countryIn = profile.label;
    }
    if (profile.metric === 'company') {
      filter.companyIn = profile.label;
    }

    const sections = this._dataConfigService.getAttendanceRateConfig();
    const reportConfig: ReportConfig = { reportType: KalturaReportType.veAttendanceHighlights, filter, order: '-count_attended' };
    this._reportService.getReport(reportConfig, sections, false).subscribe(
      report => {
        if (report.totals && this._totalRegistered > 0) {
          const tabsData = this._reportService.parseTotals(report.totals, sections.totals);
          if (tabsData.length === 2) {
            const totalAttendees = tabsData[1].rawValue !== '' ? parseInt(tabsData[1].rawValue.toString()) : 0;
            profile.rate = ReportHelper.precisionRound(totalAttendees / this._totalRegistered * 100, 1) + '%';
          } else {
            profile.rate = this._translate.instant('app.common.na');
          }
        } else {
          profile.rate = this._translate.instant('app.common.na');
        }
      },
      error => {
        profile.rate = this._translate.instant('app.common.na');
      }
    );
  }

  public _showOverlay(event: any, profile: Profile): void {
    if (this._overlay) {
      this._analytics.trackButtonClickEvent(ButtonType.Browse, 'Events_event_registrants_profile_hover_tag', profile.metric, 'Event_dashboard');
      this._currentProfile = profile;
      this._overlay.show(event);
      if (profile.rate === 'notLoaded') {
        this.loadAttendanceRate(profile);
      }
    }
  }

  public _hideOverlay(): void {
    if (this._overlay) {
      this._currentProfile = null;
      this._overlay.hide();
    }
  }

  public breakdown(): void {
    this._analytics.trackButtonClickEvent(ButtonType.Browse, 'Events_event_registrants_profile_see_breakdown', null, 'Event_dashboard');
    if (analyticsConfig.isHosted) {
      this._navigationDrillDownService.drilldown('virtual-event', this.eventIn, true);
    } else {
      this._router.navigate([`/virtual-event/${this.eventIn}`]);
    }
  }

  ngOnDestroy(): void {
  }

}
