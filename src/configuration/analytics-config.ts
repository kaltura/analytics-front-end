export interface AnalyticsConfig {
  appVersion: string;
  kalturaServer?: {
      uri?: string,
  };
  cdnServers?: {
    serverUri?: string,
    securedServerUri?: string
  };
  ks?: string;
  pid?: string;
  locale?: string;
  showNavBar?: boolean;
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

export const analyticsConfig: AnalyticsConfig = <any>{
  appVersion: '0.1'
};
