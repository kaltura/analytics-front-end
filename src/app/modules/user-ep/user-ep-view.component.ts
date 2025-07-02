import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {KalturaClient, KalturaReportInterval, VirtualEventGetAction, KalturaVirtualEvent, ScheduleEventGetAction} from 'kaltura-ngx-client';
import {cancelOnDestroy} from '@kaltura-ng/kaltura-common';
import {FrameEventManagerService, FrameEvents} from 'shared/modules/frame-event-manager/frame-event-manager.service';
import {analyticsConfig} from 'configuration/analytics-config';
import {AreaBlockerMessage} from '@kaltura-ng/kaltura-ui';
import {AppAnalytics, ButtonType, ErrorsManagerService, NavigationDrillDownService} from 'shared/services';
import {DateChangeEvent} from "shared/components/date-filter/date-filter.service";
import {DateFilterUtils, DateRanges} from "shared/components/date-filter/date-filter-utils";
import {PageScrollConfig, PageScrollInstance, PageScrollService} from "ngx-page-scroll";
import {KalturaLogger} from "@kaltura-ng/kaltura-logger";


@Component({
  selector: 'app-ep-user',
  templateUrl: './user-ep-view.component.html',
  styleUrls: ['./user-ep-view.component.scss']
})
export class UserEpViewComponent implements OnInit, OnDestroy {

  public _viewConfig = analyticsConfig.viewsConfig.userEp;
  public _blockerMessage: AreaBlockerMessage = null;
  public _eventId: string;
  public _userId = '';
  public _userName = '';
  public _loadingEvent = false;
  public _eventLoaded = false;

  public _exporting = false;
  public exportFilename = 'User_report.pdf';

  public _dateFilter: DateChangeEvent = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;

  public _actualEventStartDate: Date = null;
  public _eventStartDate: Date = null;
  public _eventEndDate: Date = null;

  constructor(private _router: Router,
              private _analytics: AppAnalytics,
              private _route: ActivatedRoute,
              private _kalturaClient: KalturaClient,
              protected _logger: KalturaLogger,
              private _errorsManager: ErrorsManagerService,
              private pageScrollService: PageScrollService,
              private _frameEventManager: FrameEventManagerService,
              private _navigationDrillDownService: NavigationDrillDownService) {
    this._logger = _logger.subLogger('UserEpViewComponent');
  }

  ngOnInit() {
    this._route.params
      .pipe(cancelOnDestroy(this))
      .subscribe(params => {
        this._eventId = params['eventId'];
        this._userId = params['userId'];
        this._userName = decodeURIComponent(params['userName']);
        if (this._eventId) {
          this._loadEventDetails();
        }
      });
  }

  private _loadEventDetails(): void {
    this._loadingEvent = true;
    this._eventLoaded = false;
    this._blockerMessage = null;

    const request = new VirtualEventGetAction({ id: parseInt(this._eventId) });
    this._kalturaClient
      .request(request)
      .pipe(cancelOnDestroy(this))
      .subscribe(
        (virtualEvent: KalturaVirtualEvent) => {
          const loadScheduledEvent = new ScheduleEventGetAction({scheduleEventId: virtualEvent.agendaScheduleEventId});
          this._kalturaClient
            .request(loadScheduledEvent)
            .pipe(cancelOnDestroy(this))
            .subscribe(
              event => {
                this._actualEventStartDate = new Date(event.startDate * 1000); // save actual start date before calculating round down start date
                this._eventStartDate = new Date(this._actualEventStartDate.getTime()); // copy the actual start date object
                // need to round down to the last hour because this is our data aggregation interval
                const minutes = this._actualEventStartDate.getMinutes();
                if (minutes !== 0) {
                  this._eventStartDate.setMinutes(0); // round down minutes
                  this._eventStartDate.setSeconds(0); // round down seconds
                }
                this._eventEndDate = new Date(event.endDate * 1000);
                this._loadingEvent = false;
                this._eventLoaded = true;
              },
              error => {
                const actions = {
                  'close': () => {
                    this._blockerMessage = null;
                  }
                };
                this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
              }
            );
        },
        error => {
          this._loadingEvent = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this._loadEventDetails();
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
  }

  public preExportHandler(): void {
  }

  public postExportHandler(): void {
  }

  public onExporting(exporting: boolean): void {
    this._exporting = exporting;
  }

  ngOnDestroy() {
  }

  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }




}
