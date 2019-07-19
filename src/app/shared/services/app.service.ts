import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { analyticsConfig, getKalturaServerUri } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaClient } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class AppService implements OnDestroy {
  private _appInit = new BehaviorSubject<boolean>(false);
  
  public readonly appInit$ = this._appInit.asObservable();
  
  public readonly viewsConfig = {
    audience: {
      engagement: {
        export: true,
        refineFilter: true,
        miniHighlights: true,
        miniTopVideos: true,
        miniPeakDay: true,
        topVideos: true,
        highlights: true,
        impressions: true,
        syndication: true,
      },
      contentInteractions: {
        export: true,
        refineFilter: true,
        miniInteractions: true,
        miniTopShared: true,
        topPlaybackSpeed: true,
        topStats: true,
        interactions: true,
        moderation: true,
      },
      geo: {
        export: true,
        refineFilter: true,
      },
      technology: {
        export: true,
        devices: true,
        topBrowsers: true,
        topOs: true,
      },
    },
    bandwidth: {
      endUser: {
        export: true,
        refineFilter: true,
      },
      publisher: {
        export: true,
        refineFilter: true,
      },
    },
    contributors: {
      export: true,
      refineFilter: true,
      miniHighlights: true,
      miniTopContributors: true,
      miniTopSources: true,
      highlights: true,
      contributors: true,
      sources: true,
    },
    entry: {
      export: true,
      refineFilter: true,
      details: true,
      totals: true,
      entryPreview: true,
      userEngagement: true,
      performance: true,
      impressions: true,
      geo: true,
      devices: true,
      syndication: true,
    },
    entryLive: {
      export: true,
      toggleLive: true,
      details: true,
      users: true,
      bandwidth: true,
      geo: true,
      status: true,
      player: true,
      streamHealth: true,
      devices: true,
      discovery: true,
    },
  };
  
  constructor(private _logger: KalturaLogger,
              private _kalturaServerClient: KalturaClient,
              private _translate: TranslateService,
              private _frameEventManager: FrameEventManagerService) {
    this._logger = _logger.subLogger('AppService');
  }
  
  ngOnDestroy(): void {
    this._appInit.complete();
  }
  
  public init(config = null, hosted = false): void {
    if (!config) {
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
    analyticsConfig.permissions = config.permissions || {};
    analyticsConfig.live = config.live || { pollInterval: 30 };
    analyticsConfig.dateFormat = config.dateFormat || 'month-day-year';
    analyticsConfig.menuConfig = config.menuConfig;
    analyticsConfig.viewsConfig = config.viewsConfig || { ...this.viewsConfig };
    
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
    this._logger.info('Loading localization...');
    this._translate.setDefaultLang(analyticsConfig.locale);
    this._translate.use(analyticsConfig.locale).subscribe(
      () => {
        this._logger.info(`Localization loaded successfully for locale: ${analyticsConfig.locale}`);
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
  
  private _initAppError(errorMsg: string): void {
    this._logger.error(errorMsg);
  }
}

