import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { analyticsConfig, getKalturaServerUri } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaClient, KalturaDetachedResponseProfile, KalturaFilterPager, KalturaMultiRequest, KalturaPermissionFilter, KalturaPermissionStatus, KalturaRequestOptions, KalturaResponseProfileType, PermissionListAction, UserGetAction, UserRoleGetAction } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { AuthService, BrowserService } from 'shared/services';
import { ConfirmationService, ConfirmDialog } from 'primeng/primeng';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter, map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AnalyticsPermissionsService } from 'shared/analytics-permissions/analytics-permissions.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [KalturaLogger.createLogger('AppComponent')]
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('confirm') private _confirmDialog: ConfirmDialog;
  @ViewChild('alert') private _alertDialog: ConfirmDialog;

  public _windowEventListener = null;
  public _confirmDialogAlignLeft = false;
  public _confirmationLabels = {
    yes: 'Yes',
    no: 'No',
    ok: 'OK'
  };

  private hosted = false;

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _confirmationService: ConfirmationService,
              private _logger: KalturaLogger,
              private _router: Router,
              private _authService: AuthService,
              private _browserService: BrowserService,
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
      .subscribe(({ url }) => this._router.navigateByUrl(this.mapRoutes(url)));
  
    this._frameEventManager.listen(FrameEvents.SetLogsLevel)
      .pipe(cancelOnDestroy(this), filter(payload => payload && this._logger.isValidLogLevel(payload.level)))
      .subscribe(({ level }) => _logger.setOptions({ level }));
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

    // TODO: check the user has permissions for multi account before updating the config
    analyticsConfig.multiAccount = config.multiAccount;

    analyticsConfig.permissions = config.permissions || {};
    analyticsConfig.live = config.live || { pollInterval: 30 };
    analyticsConfig.dateFormat = config.dateFormat || 'month-day-year';

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
        if (this.hosted) {
          this._frameEventManager.publish(FrameEvents.AnalyticsInitComplete);
        }
      },
      (error) => {
        this._initAppError(error.message);
      }
    );
  }

  private _initAppError(errorMsg: string): void{
    this._logger.error(errorMsg);
  }

  private mapRoutes(kmcRoute: string): string {
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
        analyticsRoute = '/entry';
        break;
      case '/analytics/entry-live':
        analyticsRoute = '/entry-live';
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
      }));
  }

}
