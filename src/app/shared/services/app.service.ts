import { Injectable, OnDestroy } from '@angular/core';
import { analyticsConfig, getKalturaServerUri, setConfig } from 'configuration/analytics-config';
import { BehaviorSubject, Observable } from 'rxjs';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaClient, KalturaDetachedResponseProfile, KalturaFilterPager, KalturaMultiRequest, KalturaPermissionFilter, KalturaPermissionStatus, KalturaRequestOptions, KalturaResponseProfileType, PermissionListAction, UserGetAction, UserRoleGetAction } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter, map, switchMap } from 'rxjs/operators';
import { BrowserService } from 'shared/services/browser.service';
import { ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { mapRoutes } from 'configuration/host-routing-mapping';
import { AnalyticsPermissionsService } from 'shared/analytics-permissions/analytics-permissions.service';
import { AuthService } from 'shared/services/auth.service';
import { AnalyticsPermissions } from 'shared/analytics-permissions/analytics-permissions';
import { Location } from '@angular/common';

@Injectable()
export class AppService implements OnDestroy {
  private _permissionsLoaded = new BehaviorSubject<boolean>(false);
  
  public readonly permissionsLoaded$ = this._permissionsLoaded.asObservable();
  public confirmDialogAlignLeft = false;
  public confirmationLabels = {
    yes: 'Yes',
    no: 'No',
    ok: 'OK'
  };
  
  constructor(private _logger: KalturaLogger,
              private _kalturaServerClient: KalturaClient,
              private _translate: TranslateService,
              private _browserService: BrowserService,
              private _confirmationService: ConfirmationService,
              private _router: Router,
              private _location: Location,
              private _authService: AuthService,
              private _permissionsService: AnalyticsPermissionsService,
              private _frameEventManager: FrameEventManagerService) {
    this._logger = _logger.subLogger('AppService');
  }
  
  ngOnDestroy(): void {
    this._permissionsLoaded.complete();
  }
  
  public init(): void {
    this._authService.ks = analyticsConfig.ks;
    this._authService.pid = analyticsConfig.pid;
    
    delete analyticsConfig.ks;
    delete analyticsConfig.pid;

    // set ks in ngx-client
    this._logger.info(`Setting ks in ngx-client: ${analyticsConfig.ks}`);
    this._kalturaServerClient.setOptions({
      endpointUrl: getKalturaServerUri(),
      clientTag: `kmc-analytics:${analyticsConfig.appVersion}`
    });
    this._kalturaServerClient.setDefaultRequestOptions({
      ks: this._authService.ks
    });
    
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
        this.confirmDialogAlignLeft = confirmationMessage.message && /\r|\n/.test(confirmationMessage.message);
      } else {
        this.confirmDialogAlignLeft = confirmationMessage.alignMessage === 'left';
      }
      
      this._frameEventManager.publish(FrameEvents.ModalOpened);
      
      this._confirmationService.confirm(formattedMessage);
    });
    
    this._frameEventManager.listen(FrameEvents.UpdateConfig)
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(config => setConfig(config, true));
  
    this._frameEventManager.listen(FrameEvents.Navigate)
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(({ url, queryParams }) => {
      
        // restore parent ks for multi-account when coming back from drilldown view of entry or user by clicking another menu item
        const needToRestoreParent = (url.indexOf('/analytics/entry') === -1 && url.indexOf('/analytics/user') === -1 && url.indexOf('/analytics/entry-live') === -1);
        if (needToRestoreParent) {
          this._authService.restoreParentIfNeeded();
        }
      
        this._router.navigateByUrl(mapRoutes(url, queryParams));
      });
    
    this._frameEventManager.listen(FrameEvents.SetLogsLevel)
      .pipe(cancelOnDestroy(this), filter(payload => payload && this._logger.isValidLogLevel(payload.level)))
      .subscribe(({ level }) => this._logger.setOptions({ level }));
  
    this._frameEventManager.listen(FrameEvents.UpdateMultiAccount)
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(({ multiAccount }) => {
        this._updateMultiAccount(multiAccount, true);
      });
    
    // load localization
    this._logger.info('Loading permissions and localization...');
    this._translate.setDefaultLang(analyticsConfig.locale);
    this._loadPermissions()
      .pipe(switchMap(() => this._translate.use(analyticsConfig.locale)))
      .subscribe(
        () => {
          this._logger.info(`Permissions and localization loaded successfully for locale: ${analyticsConfig.locale}`);
          if (analyticsConfig.isHosted) {
            this._frameEventManager.publish(FrameEvents.AnalyticsInitComplete);
          }
        },
        (error) => {
          this._initAppError(error.message);
        }
      );
  }
  
  private _initAppError(errorMsg: string): void {
    this._logger.error(errorMsg);
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
        this._permissionsLoaded.next(true);
      }));
  }
  
  private _updateMultiAccount(showMultiAccount: boolean, reload = false): void {
    const needToReload = reload && showMultiAccount !== analyticsConfig.multiAccount;
    
    if (this._permissionsService.hasPermission(AnalyticsPermissions.FEATURE_MULTI_ACCOUNT_ANALYTICS)) {
      analyticsConfig.multiAccount = showMultiAccount;
    } else {
      analyticsConfig.multiAccount = false;
    }
    
    if (needToReload) {
      // refresh current route to invoke data reloading using the new multi account settings
      this._router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
        this._router.navigate([decodeURI(this._location.path())]);
      });
    }
  }
}

