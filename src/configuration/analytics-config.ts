import { PollInterval } from '@kaltura-ng/kaltura-common';

export interface AnalyticsConfig {
  appVersion: string;
  valueSeparator: string;
  skipEmptyBuckets: boolean;
  multiAccount: boolean;
  defaultPageSize: number;
  permissions: {
    lazyLoadCategories?: boolean;
    enableLiveViews?: boolean;
  };
  kalturaServer?: {
      uri?: string,
      previewUIConf?: number,
  };
  cdnServers?: {
    serverUri?: string,
    securedServerUri?: string
  };
  locale?: string;
  dateFormat?: string;
  showNavBar?: boolean;
  isHosted?: boolean;
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
}

export function buildUrlWithClientProtocol(urlWithoutProtocol) {
  let protocol =  (location.protocol || '').toLowerCase();
  if (protocol[protocol.length - 1] === ':') {
    protocol =  location.protocol.substring(0, location.protocol.length - 1);
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
  let protocol =  (location.protocol || '').toLowerCase();
  if (protocol[protocol.length - 1] === ':') {
    protocol =  location.protocol.substring(0, location.protocol.length - 1);
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
  appVersion: '1.4.0',
  valueSeparator: '|',
  skipEmptyBuckets: false,
  defaultPageSize: 25,
  multiAccount: false,
  permissions: {},
};
