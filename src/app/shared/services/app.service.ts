import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AnalyticsConfig, analyticsConfig, getKalturaServerUri, ViewConfig } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaClient, KalturaDetachedResponseProfile, KalturaFilterPager, KalturaMultiRequest, KalturaPermissionFilter, KalturaPermissionStatus, KalturaRequestOptions, KalturaResponseProfileType, PermissionListAction, UserGetAction, UserRoleGetAction } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter, map, switchMap } from 'rxjs/operators';
import { AnalyticsPermissionsService } from 'shared/analytics-permissions/analytics-permissions.service';

@Injectable()
export class AppService implements OnDestroy {
  private _appInit = new BehaviorSubject<boolean>(false);
  
  public readonly appInit$ = this._appInit.asObservable();
  
  public readonly viewsConfig: ViewConfig = {
    audience: {
      engagement: {
        export: {},
        refineFilter: {
          mediaType: {},
          entrySource: {},
          tags: {},
          owners: {},
          categories: {},
          geo: {},
        },
        miniHighlights: {},
        miniTopVideos: {},
        miniPeakDay: {},
        topVideos: {},
        highlights: {},
        impressions: {},
        syndication: {},
      },
      contentInteractions: {
        export: {},
        refineFilter: {
          mediaType: {},
          entrySource: {},
          tags: {},
          owners: {},
          categories: {},
          geo: {},
        },
        miniInteractions: {},
        miniTopShared: {},
        topPlaybackSpeed: {},
        topStats: {},
        interactions: {},
        moderation: {},
      },
      geo: {
        export: {},
        refineFilter: {
          geo: {},
          tags: {},
          categories: {},
        },
      },
      technology: {
        export: {},
        devices: {},
        topBrowsers: {},
        topOs: {},
      },
    },
    bandwidth: {
      endUser: {
        export: {},
        refineFilter: {
          mediaType: {},
          entrySource: {},
          owners: {},
          geo: {},
        },
      },
      publisher: {
        export: {},
        refineFilter: {
          mediaType: {},
          entrySource: {},
          geo: {},
        },
      },
    },
    contributors: {
      export: {},
      refineFilter: {
        mediaType: {},
        entrySource: {},
        tags: {},
        owners: {},
        categories: {},
        geo: {},
      },
      miniHighlights: {},
      miniTopContributors: {},
      miniTopSources: {},
      highlights: {},
      contributors: {},
      sources: {},
    },
    entry: {
      export: {},
      refineFilter: {
        geo: {},
        owners: {},
        categories: {},
      },
      details: {},
      totals: {},
      entryPreview: {},
      userEngagement: {
        userFilter: {},
      },
      performance: {},
      impressions: {},
      geo: {},
      devices: {},
      syndication: {},
    },
    entryLive: {
      export: {},
      toggleLive: {},
      details: {},
      users: {},
      bandwidth: {},
      geo: {},
      status: {},
      player: {},
      streamHealth: {},
      devices: {},
      discovery: {},
    },
  };
  
  constructor(private _logger: KalturaLogger,
              private _kalturaServerClient: KalturaClient,
              private _translate: TranslateService,
              private _frameEventManager: FrameEventManagerService,
              private _permissionsService: AnalyticsPermissionsService) {
    this._logger = _logger.subLogger('AppService');
    
    this._frameEventManager.listen(FrameEvents.UpdateConfig)
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(config => this._setConfig(config, true));
  }
  
  ngOnDestroy(): void {
    this._appInit.complete();
  }
  
  public init(config = null, hosted = false): void {
    if (!config) {
      this._logger.error('No configuration provided! Abort initialization');
      return;
    }
    
    this._setConfig(config, hosted);
    
    // set ks in ngx-client
    this._logger.info(`Setting ks in ngx-client: ${analyticsConfig.ks}`);
    this._kalturaServerClient.setOptions({
      endpointUrl: getKalturaServerUri(),
      clientTag: `kmc-analytics:${analyticsConfig.appVersion}`
    });
    this._kalturaServerClient.setDefaultRequestOptions({
      ks: analyticsConfig.ks
    });
    
    // load localization
    this._logger.info('Loading permissions and localization...');
    this._translate.setDefaultLang(analyticsConfig.locale);
    this._loadPermissions()
      .pipe(switchMap(() => this._translate.use(analyticsConfig.locale)))
      .subscribe(
        () => {
          this._logger.info(`Permissions and localization loaded successfully for locale: ${analyticsConfig.locale}`);
          if (hosted) {
            this._frameEventManager.publish(FrameEvents.AnalyticsInitComplete);
            this._appInit.next(true);
          }
        },
        (error) => {
          this._initAppError(error.message);
        }
      );
  }
  
  private _setConfig(config: AnalyticsConfig, hosted = false): void {
    if (!config) {
      this._logger.error('No configuration provided!');
      return;
    }
    
    analyticsConfig.ks = config.ks;
    analyticsConfig.pid = config.pid;
    analyticsConfig.locale = config.locale;
    analyticsConfig.kalturaServer = config.kalturaServer;
    analyticsConfig.cdnServers = config.cdnServers;
    analyticsConfig.liveAnalytics = config.liveAnalytics;
    analyticsConfig.showNavBar = config.menuConfig && config.menuConfig.showMenu || !hosted;
    analyticsConfig.isHosted = hosted;
    analyticsConfig.live = config.live || { pollInterval: 30 };
    analyticsConfig.dateFormat = config.dateFormat || 'month-day-year';
    analyticsConfig.menuConfig = config.menuConfig;
    analyticsConfig.viewsConfig = config.viewsConfig || { ...this.viewsConfig };
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
      }));
  }
}

