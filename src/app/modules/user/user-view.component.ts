import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { KalturaClient, KalturaReportInputFilter, KalturaReportInterval, KalturaReportType, KalturaUser, UserGetAction } from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import * as moment from 'moment';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, NavigationDrillDownService } from 'shared/services';
import { TranslateService } from '@ngx-translate/core';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { UserExportConfig } from './user-export.config';
import { DateFilterUtils, DateRanges } from 'shared/components/date-filter/date-filter-utils';
import { reportTypeMap } from 'shared/utils/report-type-map';

export enum UserReportTabs {
  viewer = 'viewer',
  contributor = 'contributor',
}

@Component({
  selector: 'app-user',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss'],
  providers: [
    UserExportConfig,
  ]
})
export class UserViewComponent implements OnInit, OnDestroy {
  private eventId = '';

  public _user: KalturaUser;
  public _loadingUser = false;
  public _creationDate: moment.Moment = null;
  public _registrationDate: string;
  public _selectedRefineFilters: RefineFilter = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;
  public _totalCount: number;
  public _reportType: KalturaReportType = reportTypeMap(KalturaReportType.userUsage);
  public _selectedMetrics: string;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public _exportConfig: ExportItem[] = [];
  public _filter = new KalturaReportInputFilter({ searchInTags: true, searchInAdminTags: false });
  public _userId = '';
  public _userName = '';
  public _isCompare = false;
  public _reportTabs = UserReportTabs;
  public _userViewConfig = analyticsConfig.viewsConfig.user;
  public _currentTab = !this._userViewConfig.viewer && this._userViewConfig.contributor ? UserReportTabs.contributor : UserReportTabs.viewer;
  public carouselItems = [];

  constructor(private _router: Router,
              private _route: ActivatedRoute,
              private _location: Location,
              private _translate: TranslateService,
              private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService,
              private _navigationDrillDownService: NavigationDrillDownService,
              private _frameEventManager: FrameEventManagerService,
              private _exportConfigService: UserExportConfig) {
      this.eventId = analyticsConfig.customData && analyticsConfig.customData.eventId ? analyticsConfig.customData.eventId : '';
      if (this._userViewConfig.insights?.minutesViewed) {
        this.carouselItems.push('minutesViewed');
      }
      if (this._userViewConfig.insights?.plays) {
        this.carouselItems.push('plays');
      }
      if (this._userViewConfig.insights?.domains) {
        this.carouselItems.push('domains');
      }
      if (this._userViewConfig.insights?.sources) {
        this.carouselItems.push('sources');
      }
      if (this.eventId.length) {
        this._refineFilter = [{type: 'categories', value: {id: this.eventId}}];
      }
  }

  ngOnInit() {
    this._route.params
      .pipe(cancelOnDestroy(this))
      .subscribe(params => {
        const userId = params['id'];
        if (userId) {
          this._userId = userId.includes('?') ? userId.split('?')[0] : userId; // remove queryParams from the id
          const showContributions = !!this._route.snapshot.queryParams.showContributions;
          this._currentTab = showContributions ? UserReportTabs.contributor : UserReportTabs.viewer;
          this.loadUserDetails();
          this._exportConfig = this._exportConfigService.getConfig(this._userId, this._userViewConfig);
        }
      });
  }

  ngOnDestroy() {
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
    this._isCompare = this._dateFilter.compare.active;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
    if (this.eventId.length) {
      this._refineFilter.push({type: 'categories', value: {id: this.eventId}});
    }
  }

  private loadUserDetails(): void {
    this._loadingUser = true;
    this._blockerMessage = null;

    this._kalturaClient
      .request(new UserGetAction({ userId: this._userId }))
      .pipe(cancelOnDestroy(this))
      .subscribe(
        (user) => {
          this._user = user;
          this._userName = user.fullName;
          const dateFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
          this._registrationDate = DateFilterUtils.getMomentDate(user.createdAt).format(dateFormat);
          this._loadingUser = false;
        },
        error => {
          this._loadingUser = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
              this._location.back(); // go back in case of invalid user, probably obfuscated user id
            },
            'retry': () => {
              this.loadUserDetails();
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  public _back(): void {
    this._navigationDrillDownService.navigateBack('contributors', true);
  }

  public _selectTab(tab: UserReportTabs): void {
    if (this._dateFilter) { // reset applyIn
      delete this._dateFilter.applyIn;
    }

    this._currentTab = tab;
  }
}
