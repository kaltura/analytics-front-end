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
import { ErrorsManagerService } from 'shared/services';
import { TranslateService } from '@ngx-translate/core';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { UserExportConfig } from './user-export.config';
import { Unsubscribable } from 'rxjs';
import { DateFilterUtils } from "shared/components/date-filter/date-filter-utils";

@Component({
  selector: 'app-user',
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.scss'],
  providers: [
    UserExportConfig,
  ]
})
export class UserViewComponent implements OnInit, OnDestroy {
  private _requestSubscription: Unsubscribable;
  private _subscription: Unsubscribable;
  
  public _user: KalturaUser;
  public _loadingUser = false;
  public _creationDate: moment.Moment = null;
  public _registrationDate: string;
  public _selectedRefineFilters: RefineFilter = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;
  public _totalCount: number;
  public _reportType: KalturaReportType = KalturaReportType.userUsage;
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
  
  constructor(private _router: Router,
              private _route: ActivatedRoute,
              private _translate: TranslateService,
              private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService,
              private _frameEventManager: FrameEventManagerService,
              private _exportConfigService: UserExportConfig) {
    this._exportConfig = _exportConfigService.getConfig();
  }
  
  ngOnInit() {
    if (analyticsConfig.isHosted) {
      this._frameEventManager
        .listen(FrameEvents.UpdateFilters)
        .pipe(cancelOnDestroy(this), filter(Boolean))
        .subscribe(({ queryParams }) => {
          this._userId = queryParams['id'];
          if (this._userId) {
            this.loadUserDetails();
          }
        });
    } else {
      this._subscription = this._route.params.subscribe(params => {
        this._userId = params['id'];
        if (this._userId) {
          this.loadUserDetails();
        }
      });
    }
    
  }
  
  ngOnDestroy() {
    if (this._subscription) {
      this._subscription.unsubscribe();
      this._subscription = null;
    }
    
    if (this._requestSubscription) {
      this._requestSubscription.unsubscribe();
      this._requestSubscription = null;
    }
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
    
    this._requestSubscription = this._kalturaClient
      .request(new UserGetAction({ userId: this._userId }))
      .pipe(cancelOnDestroy(this))
      .subscribe(
        (user) => {
          this._user = user;
          this._userName = user.fullName;
          const dateFormat = analyticsConfig.dateFormat === 'month-day-year' ? 'MM/DD/YYYY' : 'DD/MM/YYYY';
          this._registrationDate = DateFilterUtils.getMomentDate(user.createdAt).format(dateFormat);
          this._requestSubscription = null;
          this._loadingUser = false;
        },
        error => {
          this._requestSubscription = null;
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
    if (analyticsConfig.isHosted) {
      this._frameEventManager.publish(FrameEvents.EntryNavigateBack);
    } else {
      this._router.navigate(['contributors'], { queryParams: this._route.snapshot.queryParams });
    }
  }
}
