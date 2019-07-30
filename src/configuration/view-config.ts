export interface ViewConfig {
  [key: string]: ViewConfig;
}

export const viewsConfig = {
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
    totals: {
      plays: {},
      uniqueViewers: {},
      minutesViewed: {},
      completionRate: {},
      likes: {},
      comments: {},
    },
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
