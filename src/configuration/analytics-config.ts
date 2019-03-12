export interface AnalyticsConfig {
  appVersion: string;
  valueSeparator: string;
  skipEmptyBuckets: boolean;
  defaultPageSize: number;
  kalturaServer?: {
      uri?: string,
    previewUIConf?: number
  };
  cdnServers?: {
    serverUri?: string,
    securedServerUri?: string
  };
  ks?: string;
  pid?: string;
  locale?: string;
  showNavBar?: boolean;
  isHosted?: boolean;
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
  appVersion: '0.5.1',
  valueSeparator: '|',
  skipEmptyBuckets: false,
  defaultPageSize: 25,
};
