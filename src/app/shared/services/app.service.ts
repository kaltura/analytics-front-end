import { Injectable, OnDestroy } from '@angular/core';
import { analyticsConfig, getKalturaServerUri, setConfig } from 'configuration/analytics-config';
import { BehaviorSubject, Observable } from 'rxjs';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import {
  KalturaClient,
  KalturaDetachedResponseProfile,
  KalturaFilterPager,
  KalturaMultiRequest,
  KalturaPermissionFilter,
  KalturaPermissionStatus,
  KalturaRequestOptions,
  KalturaResponseProfileType, KalturaUiConf,
  KalturaUiConfFilter,
  PartnerGetAction,
  PermissionGetCurrentPermissionsAction,
  PermissionListAction,
  UiConfListTemplatesAction,
  UserGetAction,
  UserRoleGetAction
} from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter, map, switchMap, skip } from 'rxjs/operators';
import { BrowserService } from 'shared/services/browser.service';
import { ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { mapRoutes } from 'configuration/host-routing-mapping';
import { AnalyticsPermissionsService } from 'shared/analytics-permissions/analytics-permissions.service';
import { AuthService } from 'shared/services/auth.service';
import { AnalyticsPermissions } from 'shared/analytics-permissions/analytics-permissions';
import { Location } from '@angular/common';
import { AppAnalytics } from "./app-analytics.service";

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

  private readonly supportedLanguages = ['de', 'en', 'es', 'fr', 'ja', 'nl', 'pt_br', 'ru', 'zh_hans', 'zh_hant'];

  constructor(private _logger: KalturaLogger,
              private _kalturaServerClient: KalturaClient,
              private _translate: TranslateService,
              private _browserService: BrowserService,
              private _analytics: AppAnalytics,
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

    // init Analytics
    this._analytics.init();

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
      .subscribe((config: any) => setConfig(config, true));

    this._frameEventManager.listen(FrameEvents.Navigate)
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(({ url, queryParams, prevRoute }) => {

        // restore parent ks for multi-account when coming back from drilldown view of entry or user by clicking another menu item
        const needToRestoreParent = (url.indexOf('/analytics/entry') === -1 && url.indexOf('/analytics/user') === -1 && url.indexOf('/analytics/entry-live') === -1 && url.indexOf('/analytics/entry-webcast') === -1);
        if (needToRestoreParent) {
          this._authService.restoreParentIfNeeded();
        }

        this._router.navigateByUrl(mapRoutes(url, queryParams, prevRoute), { replaceUrl: true });
      });

    this._frameEventManager.listen(FrameEvents.SetLogsLevel)
      .pipe(cancelOnDestroy(this), filter(payload => payload && this._logger.isValidLogLevel(payload.level)))
      .subscribe(({ level }) => this._logger.setOptions({ level }));

    this._frameEventManager.listen(FrameEvents.SetLanguage)
      .pipe(cancelOnDestroy(this), filter(payload => payload && this.supportedLanguages.indexOf(payload) > -1))
      .subscribe(( locale ) => {
        this._translate.use(locale).subscribe(
          success => {
            this._logger.info(`New localization loaded: ${locale}`);
          },
          error => {
            this._logger.error(`Localization loading failed: ${locale}, error message: ${error}`);
          }
        );
      });

    this._frameEventManager.listen(FrameEvents.UpdateMultiAccount)
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(({ multiAccount }) => {
        this._updateMultiAccount(multiAccount, true);
      });

    this._frameEventManager.listen(FrameEvents.ToggleContrastTheme)
      .pipe(cancelOnDestroy(this), skip(1))
      .subscribe(() => {
        this._browserService.toggleContrastTheme();
      });

    // load localization
    this._logger.info('Loading permissions and localization...');
    this._translate.setDefaultLang('en');
    this._translate.use(analyticsConfig.locale);
    this._loadPermissionsAndPartner()
      .pipe(switchMap(() => this._translate.use(analyticsConfig.locale)))
      .subscribe(
        () => {
          this._logger.info(`Permissions and localization loaded successfully for locale: ${analyticsConfig.locale}`);
          if (analyticsConfig.isHosted) {
            this._frameEventManager.publish(FrameEvents.AnalyticsInitComplete);
          }
          if (analyticsConfig.contrastTheme) {
            this._browserService.toggleContrastTheme();
          }
        },
        (error) => {
          this._initAppError(error.message);
        }
      );

    // Load jQuery to support player loading long configuration string (more than 2083 characters)
    if (analyticsConfig.previewPlayer.loadJquery && document.getElementById("jquery") === null) {
      let jq = document.createElement('script');
      jq.src = 'assets/jquery-3.5.1.min.js';
      jq.id = "jquery";
      jq.integrity = "sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=";
      jq.crossOrigin = "anonymous";
      jq.async = false;
      document.head.appendChild(jq);
    }
  }

  private _initAppError(errorMsg: string): void {
    this._logger.error(errorMsg);
  }

  private _loadPermissionsAndPartner(): Observable<void> {
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
    const getCurrentPermissions = new PermissionGetCurrentPermissionsAction(); // this one is used in cases user ks cannot list permissions and get role

    const getPartnerAction = new PartnerGetAction({id: parseInt(this._authService.pid)}).setRequestOptions(
      new KalturaRequestOptions({
        responseProfile: new KalturaDetachedResponseProfile({
          type: KalturaResponseProfileType.includeFields,
          fields: 'createdAt'
        })
      })
    );

    // load players from partner 0 if not provided in config
    let mr: KalturaMultiRequest;
    if (!analyticsConfig.kalturaServer.previewUIConf || !analyticsConfig.kalturaServer.previewUIConfV7) {
      let tags = '';
      const v2Tag = 'AnalyticsV2_v' + analyticsConfig.appVersion;
      const v7Tag = 'AnalyticsV7_v' + analyticsConfig.appVersion;
      if (!analyticsConfig.kalturaServer.previewUIConf && !analyticsConfig.kalturaServer.previewUIConfV7) {
        tags = v2Tag + ',' + v7Tag;
      } else if (!analyticsConfig.kalturaServer.previewUIConf) {
        tags = v2Tag;
      } else {
        tags = v7Tag;
      }
      const listUIConfAction = new UiConfListTemplatesAction({
        filter: new KalturaUiConfFilter({
          partnerIdEqual: 0,
          tagsMultiLikeAnd: 'autodeploy',
          tagsMultiLikeOr: tags
        })
      });
      mr = new KalturaMultiRequest(getUserAction, getRoleAction, getPermissionsAction, getCurrentPermissions, getPartnerAction, listUIConfAction);
    } else {
      mr = new KalturaMultiRequest(getUserAction, getRoleAction, getPermissionsAction, getCurrentPermissions, getPartnerAction);
    }

    return this._kalturaServerClient.multiRequest(mr)
      .pipe(map(responses => {
        const [userResponse, roleResponse, permissionsResponse, currentPermissionsResponse, partnerResponse, playersListResponse] = responses;
        const initPlayers = () => {
          if (playersListResponse && playersListResponse.result) {
            const players: KalturaUiConf[] = playersListResponse.result.objects || [];
            const v2UIConf: KalturaUiConf = players.find(player => player.tags.indexOf('AnalyticsV2_v' + analyticsConfig.appVersion) > -1);
            const v7UIConf: KalturaUiConf = players.find(player => player.tags.indexOf('AnalyticsV7_v' + analyticsConfig.appVersion) > -1);
            if (!analyticsConfig.kalturaServer.previewUIConf) {
              analyticsConfig.kalturaServer.previewUIConf = v2UIConf ? v2UIConf.id : null;
            }
            if (!analyticsConfig.kalturaServer.previewUIConfV7) {
              analyticsConfig.kalturaServer.previewUIConfV7 = v7UIConf ? v7UIConf.id : null;
            }
          }
        }
        if (responses.hasErrors()) {
          const err = responses.getFirstError();
          if (err.code === "SERVICE_FORBIDDEN") {
            // weak ks such as KMS user cannot load user roles. In that case we will use the getCurrentPermissions API to load current permissions disregarding user roles
            // if getCurrentPermissions didn't return a valid result (for example an exception) - we will init the permissions manager with no permissions as all
            const currentPermissions = currentPermissionsResponse && currentPermissionsResponse.result ? currentPermissionsResponse.result.split(',') : [];
            // since FEATURE_LOAD_THUMBNAIL_WITH_KS is a partner feature it is not returned by the getCurrentPermissions API so it is send from KMS using configuration
            if (analyticsConfig.loadThumbnailWithKs) {
              currentPermissions.push('FEATURE_LOAD_THUMBNAIL_WITH_KS');
            }
            this._permissionsService.load(currentPermissions, currentPermissions);
            this._permissionsLoaded.next(true);
            initPlayers();
          } else {
            // all other errors should stop the permissions loading process
            throw err;
          }
        } else {
          const permissionList = permissionsResponse.result;
          const userRole = roleResponse.result;
          const partnerPermissionList = permissionList.objects.map(item => item.name);
          const userRolePermissionList = userRole.permissionNames.split(',');
          this._permissionsService.load(userRolePermissionList, partnerPermissionList);
          this._permissionsLoaded.next(true);
          this._authService.partnerCreatedAt = partnerResponse.result.createdAt;
          initPlayers();
        }
      }));
  }

  private _updateMultiAccount(showMultiAccount: boolean, reload = false): void {
    const needToReload = reload && showMultiAccount !== analyticsConfig.multiAccount;
    const navigate = url => {
      if (analyticsConfig.isHosted) {
        this._frameEventManager.publish(FrameEvents.NavigateTo, url);
      } else {
        this._router.navigateByUrl(mapRoutes(url, null, null));
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

