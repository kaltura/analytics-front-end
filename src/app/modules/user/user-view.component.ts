import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { KalturaClient, KalturaReportInputFilter, KalturaReportInterval, KalturaReportType, KalturaUser, UserGetAction } from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { DateChangeEvent, DateRanges } from 'shared/components/date-filter/date-filter.service';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { analyticsConfig } from 'configuration/analytics-config';
import { filter } from 'rxjs/operators';
import * as moment from 'moment';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, NavigationDrillDownService } from 'shared/services';
import { TranslateService } from '@ngx-translate/core';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { UserExportConfig } from './user-export.config';
import { Unsubscribable } from 'rxjs';
import { DateFilterUtils } from 'shared/components/date-filter/date-filter-utils';
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
  public _currentTab = UserReportTabs.viewer;
  
  constructor(private _router: Router,
              private _route: ActivatedRoute,
              private _translate: TranslateService,
              private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService,
              private _navigationDrillDownService: NavigationDrillDownService,
              private _frameEventManager: FrameEventManagerService,
              private _exportConfigService: UserExportConfig) {
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
          this._exportConfig = this._exportConfigService.getConfig(this._userId);
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
}
