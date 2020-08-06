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
      highlights: {
        userFilter: {}
      },
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
    title: {},
    export: {},
    refineFilter: {
      geo: {},
      owners: {},
      categories: {},
    },
    details: {},
    totals: {
      social: {
        likes: {},
        shares: {}
      }
    },
    entryPreview: {},
    userEngagement: {
      userFilter: {}
    },
    performance: {},
    impressions: {},
    geo: {},
    devices: {},
    syndication: {},
  },
  category: {
    title: {},
    export: {},
    refineFilter: {
      mediaType: {},
      entrySource: {},
      tags: {},
      owners: {},
      context: {},
      categories: {},
      geo: {},
    },
    details: {},
    miniHighlights: {},
    miniPageViews: {},
    miniTopViewers: {},
    miniTopVideos: {},
    insights: {
      domains: {},
      geo: {},
      devices: {}
    },
    performance: {
      userDrilldown: {},
      userFilter: {},
      userLink: {},
      entryDrilldown: {},
      entryFilter: {},
      entryLink: {}
    },
    topVideos: {},
    subcategories: {},
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
  playlist: {
    title: {},
    export: {},
    refineFilter: {
      geo: {},
      owners: {},
      categories: {},
    },
    details: {},
    totals: {},
    performance: {},
    videos: {},
  },
  user: {
    export: {},
    refineFilter: {
      mediaType: {},
      entrySource: {},
      tags: {},
      categories: {},
    },
    totals: {},
    geoDevices: {},
    lastViewedEntries: {},
    insights: {
      minutesViewed: {},
      plays: {},
      domains: {},
      sources: {},
    },
    viewer: {
      viewedEntries: {},
      engagement: {},
    },
    contributor: {
      mediaUpload: {},
      topContent: {},
      sources: {},
    },
  },
};
