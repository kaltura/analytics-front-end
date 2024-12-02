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

export enum EntryLiveUsersMode {
  Authenticated = 'Authenticated',
  All = 'All',
}

export interface AnalyticsConfig {
  appVersion: string;
  valueSeparator: string;
  skipEmptyBuckets: boolean;
  multiAccount: boolean;
  defaultPageSize: number;
  liveEntryUsersReports?: string;
  originTarget: string;
  kalturaServer?: {
    uri?: string,
    previewUIConf?: number,
    previewUIConfV7?: number,
    exportRoute?: string
  };
  externalServices?: {
    appRegistryEndpoint?: {
      uri: string
    },
    userReportsEndpoint?: {
      uri: string;
    }
  };
  analyticsServer?: {
    uri?: string
  };
  cdnServers?: {
    serverUri?: string,
    securedServerUri?: string
  };
  ks?: string;
  pid?: string;
  locale?: string;
  loadThumbnailWithKs?: boolean;
  dateFormat?: string;
  showNavBar?: boolean;
  isHosted?: boolean;
  hostAppName?: string;
  hostAppVersion?: string;
  contrastTheme?: boolean;
  menuConfig?: {
    showMenu: boolean;
    items?: MenuItem[];
  };
  viewsConfig?: {
    [key: string]: ViewConfig;
  };
  previewPlayer?: {
    loadJquery: boolean;
  };
  live?: {
    pollInterval?: PollInterval;
    healthNotificationsCount?: number;
  };
  customData?: {
    [key: string]: any;
  };
  predefinedFilter?: {
    [key: string]: any;
  };
  customStyle?: {
    baseClassName: string,
    css: any
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
  appVersion: '3.7.8',
  valueSeparator: '|',
  skipEmptyBuckets: false,
  defaultPageSize: 25,
  originTarget: '*',
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
  analyticsConfig.externalServices = config.externalServices;
  analyticsConfig.analyticsServer = config.analyticsServer;
  analyticsConfig.cdnServers = config.cdnServers;
  analyticsConfig.showNavBar = config.menuConfig && config.menuConfig.showMenu || !hosted;
  analyticsConfig.isHosted = hosted;
  analyticsConfig.live = config.live || { pollInterval: 30 };
  analyticsConfig.dateFormat = config.dateFormat || 'month-day-year';
  analyticsConfig.menuConfig = config.menuConfig;
  analyticsConfig.viewsConfig = config.viewsConfig || { ...viewsConfig };
  analyticsConfig.customData = config.customData || { };
  analyticsConfig.predefinedFilter = config.predefinedFilter || { };
  analyticsConfig.multiAccount = config.multiAccount || false;
  analyticsConfig.previewPlayer = config.previewPlayer || { loadJquery: true };
  analyticsConfig.loadThumbnailWithKs = config.loadThumbnailWithKs || false;
  if (config.hostAppName) {
    analyticsConfig.hostAppName = config.hostAppName;
  }
  if (config.hostAppVersion) {
    analyticsConfig.hostAppVersion = config.hostAppVersion;
  }
  setLiveEntryUsersReports(config.liveEntryUsersReports);
  if (config.customStyle) {
    setCustomStyle(config.customStyle);
  }
}

function setLiveEntryUsersReports(value: string): void {
  const allowedValues = Object.keys(EntryLiveUsersMode);
  analyticsConfig.liveEntryUsersReports = allowedValues.indexOf(value) !== -1 ? value : EntryLiveUsersMode.All;
}

function setCustomStyle(value: {baseClassName: string, css: any}): void {
  try {
    document.body.classList.add(value.baseClassName); // add baseClassName to body
    // inject CSS to head
    let css = document.createElement('style');
    css.innerText = value.css.replace(/(\r\n|\n|\r)/gm, '');
    document.getElementsByTagName('head')[0].appendChild(css);
  } catch (e) {
    console.warn(`Error injecting custom CSS: ${e.message}`);
  }
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
