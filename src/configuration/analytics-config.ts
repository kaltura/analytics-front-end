import { PollInterval } from '@kaltura-ng/kaltura-common';
import { ViewConfig, viewsConfig } from 'configuration/view-config';
import { Observable } from 'rxjs';
import { menu } from '../app/app-menu/app-menu.config';

export interface MenuItem {
  id: string;
  link: string;
  label: string;
  items?: MenuItem[];
}

export interface AnalyticsConfig {
  appVersion: string;
  valueSeparator: string;
  skipEmptyBuckets: boolean;
  multiAccount: boolean;
  defaultPageSize: number;
  originTarget: string;
  kalturaServer?: {
    uri?: string,
    previewUIConf?: number,
  };
  cdnServers?: {
    serverUri?: string,
    securedServerUri?: string
  };
  ks?: string;
  pid?: string;
  locale?: string;
  dateFormat?: string;
  showNavBar?: boolean;
  isHosted?: boolean;
  menuConfig?: {
    showMenu: boolean;
    items?: MenuItem[];
  };
  viewsConfig?: {
    [key: string]: ViewConfig;
  };
  live?: {
    pollInterval?: PollInterval;
    healthNotificationsCount?: number;
  };
  liveAnalytics?: {
    uri?: string;
    uiConfId?: string;
    mapUrls?: string[];
    mapZoomLevels?: string;
  };
  customData?: {
    [key: string]: any;
  };
}

export function buildUrlWithClientProtocol(urlWithoutProtocol) {
  let protocol = (location.protocol || '').toLowerCase();
  if (protocol[protocol.length - 1] === ':') {
    protocol = location.protocol.substring(0, location.protocol.length - 1);
  }
  return `${protocol}://${urlWithoutProtocol}`;
}

export function getKalturaServerUri(suffix: string = ''): string {
  if (analyticsConfig.kalturaServer && analyticsConfig.kalturaServer.uri) {
    const serverEndpoint = analyticsConfig.kalturaServer.uri;
    return buildUrlWithClientProtocol(`${serverEndpoint}${suffix}`);
  } else {
    throw new Error(`cannot provide kaltura server uri. server configuration wasn't loaded already`);
  }
}

export function buildCDNUrl(suffix: string): string {
  let protocol = (location.protocol || '').toLowerCase();
  if (protocol[protocol.length - 1] === ':') {
    protocol = location.protocol.substring(0, location.protocol.length - 1);
  }
  let baseUrl = '';
  if (protocol === 'https') {
    baseUrl = analyticsConfig.cdnServers.securedServerUri;
  } else {
    baseUrl = analyticsConfig.cdnServers.serverUri;
  }
  
  return `${baseUrl}${suffix}`;
}

export const analyticsConfig: AnalyticsConfig = {
  appVersion: '1.4.1',
  valueSeparator: '|',
  skipEmptyBuckets: false,
  defaultPageSize: 25,
  originTarget: window.location.origin,
  multiAccount: false,
};

export function setConfig(config: AnalyticsConfig, hosted = false): void {
  if (!config) {
    throw Error('No configuration provided!');
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
  analyticsConfig.viewsConfig = config.viewsConfig || { ...viewsConfig };
  analyticsConfig.customData = config.customData || { };
}

export function initConfig(): Observable<void> {
  return new Observable(observer => {
    if (window['analyticsConfig']) { // standalone
      setConfig(window['analyticsConfig']);
      observer.next();
      observer.complete();
      return () => {
      };
    }
    
    // hosted
    window.parent.postMessage(
      { messageType: 'analyticsInit', payload: { menuConfig: menu, viewsConfig: viewsConfig } },
      analyticsConfig.originTarget,
    );
    
    const initEventHandler = event => {
      if (event.data && event.data.messageType === 'init') {
        setConfig(event.data.payload, true);
        observer.next();
        observer.complete();
      }
    };
    
    window.addEventListener('message', initEventHandler);
    
    return () => {
      window.removeEventListener('message', initEventHandler);
    };
  });
}
