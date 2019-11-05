import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { analyticsConfig, getKalturaServerUri } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaClient, KalturaDetachedResponseProfile, KalturaFilterPager, KalturaMultiRequest, KalturaPermissionFilter, KalturaPermissionStatus, KalturaRequestOptions, KalturaResponseProfileType, PermissionListAction, UserGetAction, UserRoleGetAction } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { AuthService, BrowserService } from 'shared/services';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { cancelOnDestroy, OperationTagManagerService } from '@kaltura-ng/kaltura-common';
import { filter, map, observeOn, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { async } from 'rxjs/scheduler/async';
import { AnalyticsPermissionsService } from 'shared/analytics-permissions/analytics-permissions.service';
import { AnalyticsPermissions } from 'shared/analytics-permissions/analytics-permissions';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { EntryLiveUsersMode } from 'shared/utils/live-report-type-map';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [KalturaLogger.createLogger('AppComponent')]
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('confirm', { static: false }) private _confirmDialog: ConfirmDialog;
  @ViewChild('alert', { static: false }) private _alertDialog: ConfirmDialog;

  public _isBusy: boolean = false;
  public _confirmDialogAlignLeft = false;
  public _confirmationLabels = {
    yes: 'Yes',
    no: 'No',
    ok: 'OK'
  };

  public _permissionsLoaded = false;
  private hosted = false;

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _confirmationService: ConfirmationService,
              private _logger: KalturaLogger,
              private _router: Router,
              private _location: Location,
              private _authService: AuthService,
              private _browserService: BrowserService,
              private _oprationsTagManager: OperationTagManagerService,
              private _permissionsService: AnalyticsPermissionsService,
              private _kalturaServerClient: KalturaClient) {
    if (window['analyticsConfig']) { // standalone
      this._initApp(window['analyticsConfig']);
    } else { // hosted
      this._frameEventManager.listen(FrameEvents.Init)
        .pipe(cancelOnDestroy(this), filter(Boolean))
        .subscribe(config => this._initApp(config, true));
    }
    
    this._frameEventManager.listen(FrameEvents.Navigate)
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(({ url, queryParams, prevRoute }) => {
        // restore parent ks for multi-account when coming back from drilldown view of entry or user by clicking another menu item
        const needToRestoreParent = (url.indexOf('/analytics/entry') === -1 && url.indexOf('/analytics/user') === -1 && url.indexOf('/analytics/entry-live') === -1);
        if (needToRestoreParent) {
          this._authService.restoreParentIfNeeded();
        }

        this._router.navigateByUrl(this.mapRoutes(url, queryParams, prevRoute));
      });
  
    this._frameEventManager.listen(FrameEvents.SetLogsLevel)
      .pipe(cancelOnDestroy(this), filter(payload => payload && this._logger.isValidLogLevel(payload.level)))
      .subscribe(({ level }) => _logger.setOptions({ level }));

    this._frameEventManager.listen(FrameEvents.UpdateMultiAccount)
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(({ multiAccount }) => {
        this._updateMultiAccount(multiAccount, true);
      });
  }

  ngOnInit() {
    this._browserService.registerOnShowConfirmation((confirmationMessage) => {
      const htmlMessageContent = confirmationMessage.message.replace(/\r|\n/g, '<br/>');
      const formattedMessage = Object.assign(
        {},
        confirmationMessage,
        { message: htmlMessageContent },
        {
          accept: () => {
            this._frameEventManager.publish(FrameEvents.ModalClosed);
            if (typeof confirmationMessage.accept === 'function') {
              confirmationMessage.accept();
            }
          },
        },
        {
          reject: () => {
            this._frameEventManager.publish(FrameEvents.ModalClosed);
            if (typeof confirmationMessage.reject === 'function') {
              confirmationMessage.reject();
            }
          },
        }
      );

      if (confirmationMessage.alignMessage === 'byContent') {
        this._confirmDialogAlignLeft = confirmationMessage.message && /\r|\n/.test(confirmationMessage.message);
      } else {
        this._confirmDialogAlignLeft = confirmationMessage.alignMessage === 'left';
      }

      this._frameEventManager.publish(FrameEvents.ModalOpened);

      this._confirmationService.confirm(formattedMessage);
    });

    // handle app status: busy and error messages. Allow closing error window using the 'OK' button
    this._oprationsTagManager.tagStatus$
      .pipe(observeOn(async))
      .subscribe((tags: {[key: string]: number}) => {
        this._isBusy = tags['block-shell'] > 0;
      });

    this._frameEventManager.publish(FrameEvents.AnalyticsInit);
  }
  
  ngOnDestroy() {

  }

  private _initApp(config = null, hosted = false): void {
    if (!config) {
      return;
    }

    this.hosted = hosted; // hosted;
    this._authService.ks = config.ks;
    this._authService.pid = config.pid;

    analyticsConfig.locale = config.locale;
    analyticsConfig.kalturaServer = config.kalturaServer;
    analyticsConfig.cdnServers = config.cdnServers;
    analyticsConfig.liveAnalytics = config.liveAnalytics;
    analyticsConfig.showNavBar = !this.hosted;
    analyticsConfig.isHosted = this.hosted;
    analyticsConfig.permissions = config.permissions || {};
    analyticsConfig.live = config.live || { pollInterval: 30 };
    analyticsConfig.dateFormat = config.dateFormat || 'month-day-year';
    this._setLiveEntryUsersReports(config.liveEntryUsersReports);

    // set ks in ngx-client
    this._logger.info(`Setting ks in ngx-client: ${this._authService.ks}`);
    this._kalturaServerClient.setOptions({
      endpointUrl: getKalturaServerUri(),
      clientTag: `kmc-analytics:${analyticsConfig.appVersion}`
    });

    this._kalturaServerClient.setDefaultRequestOptions({
      ks: this._authService.ks
    });

    // load localization
    this._logger.info('Loading permissions and localization...');
    this._translate.setDefaultLang(analyticsConfig.locale);
    this._loadPermissions()
      .pipe(switchMap(() => this._translate.use(analyticsConfig.locale)))
      .subscribe(
        () => {
        this._logger.info(`Permissions and localization loaded successfully for locale: ${analyticsConfig.locale}`);
        this._updateMultiAccount(config.multiAccount || false);
        if (this.hosted) {
          this._frameEventManager.publish(FrameEvents.AnalyticsInitComplete);
        }
      },
      (error) => {
        this._initAppError(error.message);
      }
    );
  }
  
  private _setLiveEntryUsersReports(str: string): void {
    if (typeof str === 'string') {
      const allowedValues = Object.keys(EntryLiveUsersMode);
      const value = str.charAt(0).toUpperCase() + str.slice(1); // uppercase string
      analyticsConfig.liveEntryUsersReports = allowedValues.indexOf(value) !== -1 ? value : EntryLiveUsersMode.All;
    } else {
      analyticsConfig.liveEntryUsersReports = EntryLiveUsersMode.All;
    }
  }

  private _initAppError(errorMsg: string): void{
    this._logger.error(errorMsg);
  }

  private mapRoutes(kmcRoute: string, queryParams: { [key: string]: string }, prevRoute: string): string {
    const idPostfix = queryParams && queryParams['id'] ? `/${queryParams['id']}` : '';
    let analyticsRoute = kmcRoute;
    switch (kmcRoute) {
      case '/analytics/contributors':
        analyticsRoute = '/contributors/top-contributors';
        break;
      case '/analytics/technology':
        analyticsRoute = '/audience/technology';
        break;
      case '/analytics/geo-location':
        analyticsRoute = '/audience/geo-location';
        break;
      case '/analytics/content-interactions':
        analyticsRoute = '/audience/content-interactions';
        break;
      case '/analytics/engagement':
        analyticsRoute = '/audience/engagement';
        break;
      case '/analytics/publisher':
        analyticsRoute = '/bandwidth/publisher';
        break;
      case '/analytics/enduser':
        analyticsRoute = '/bandwidth/end-user';
        break;
      case '/analytics/live':
        analyticsRoute = '/live/live-reports';
        break;
      case '/analytics/entry':
        analyticsRoute = `/entry${idPostfix}`;
        break;
      case '/analytics/user':
        const showContributions = prevRoute && prevRoute.indexOf('contributor') !== -1;
        const params = showContributions ? '?showContributions=true' : '';
        analyticsRoute = `/user${idPostfix}${params}`;
        break;
      case '/analytics/entry-live':
        analyticsRoute = `/entry-live${idPostfix}`;
        break;
      default:
        break;
    }
    return analyticsRoute;
  }
  
  private _loadPermissions(): Observable<void> {
    const getUserAction = new UserGetAction().setRequestOptions(
      new KalturaRequestOptions({
        responseProfile: new KalturaDetachedResponseProfile({
          type: KalturaResponseProfileType.includeFields,
          fields: 'roleIds'
        })
      })
    );
    const getRoleAction = new UserRoleGetAction({ userRoleId: 0 }).setDependency(['userRoleId', 0, 'roleIds']);
    const getPermissionsAction = new PermissionListAction({
      filter: new KalturaPermissionFilter({ statusEqual: KalturaPermissionStatus.active, typeIn: '2,3' }),
      pager: new KalturaFilterPager({ pageSize: 500 }),
    })
      .setRequestOptions(
        new KalturaRequestOptions({
          responseProfile: new KalturaDetachedResponseProfile({
            type: KalturaResponseProfileType.includeFields,
            fields: 'name'
          })
        })
      );
    
    return this._kalturaServerClient.multiRequest(new KalturaMultiRequest(getUserAction, getRoleAction, getPermissionsAction))
      .pipe(map(responses => {
        if (responses.hasErrors()) {
          throw responses.getFirstError();
        }
        
        const [userResponse, roleResponse, permissionsResponse] = responses;
        const permissionList = permissionsResponse.result;
        const userRole = roleResponse.result;
        const partnerPermissionList = permissionList.objects.map(item => item.name);
        const userRolePermissionList = userRole.permissionNames.split(',');
        this._permissionsService.load(userRolePermissionList, partnerPermissionList);
        this._permissionsLoaded = true;
      }));
  }

  private _updateMultiAccount(showMultiAccount: boolean, reload = false): void {
    const needToReload = reload && showMultiAccount !== analyticsConfig.multiAccount;
    const navigate = url => {
      if (analyticsConfig.isHosted) {
        this._frameEventManager.publish(FrameEvents.NavigateTo, url);
      } else {
        this._router.navigateByUrl(this.mapRoutes(url, null, null));
      }
    };
    const refresh = () => {
      // refresh current route to invoke data reloading using the new multi account settings
      this._router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this._router.navigate([decodeURI(this._location.path())]);
      });
    };
    
    if (this._permissionsService.hasPermission(AnalyticsPermissions.FEATURE_MULTI_ACCOUNT_ANALYTICS)) {
      analyticsConfig.multiAccount = showMultiAccount;
    } else {
      analyticsConfig.multiAccount = false;
    }
    
    if (needToReload) {
      if (showMultiAccount) {
        refresh();
      } else {
        // go to the default page when switching to parent account
        const currentUrl = this._router.routerState.snapshot.url;
        if (currentUrl.includes('entry') && !currentUrl.includes('live')) {
          navigate('/analytics/engagement');
        } else if (currentUrl.includes('user')) {
          navigate('/analytics/contributors');
        } else {
          refresh();
        }
      }
    }
  }
}
