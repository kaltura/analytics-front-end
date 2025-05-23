import {VEMiniAttendanceComponent} from "../app/modules/virtual-event/views/mini-attendance/mini-attendance.component";

export interface ViewConfig {
  [key: string]: ViewConfig;
}

export const viewsConfig = {
  audience: {
    engagement: {
      title: {},
      backBtn: {},
      download: {},
      export: {},
      refineFilter: {
        mediaType: {},
        playbackType: {
          filterLiveOnStart: null
        },
        entrySource: {},
        tags: {},
        owners: {},
        categories: {},
        domains: {},
        geo: {},
      },
      miniHighlights: {},
      miniTopVideos: {},
      miniPeakDay: {},
      topVideos: {},
      highlights: {
        userFilter: {},
        userDrilldown: {},
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
        domains: {},
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
        playbackType: {},
        tags: {},
        categories: {},
        domains: {},
      },
    },
    technology: {
      export: {},
      devices: {},
      topBrowsers: {},
      topOs: {},
      refineFilter: {
        playbackType: {},
      },
    },
  },
  bandwidth: {
    overview: {
      export: {},
      refineFilter: {
        mediaType: {},
        entrySource: {},
        owners: {},
        geo: {},
      },
    },
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
      domains: {},
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
    backBtn: {},
    export: {},
    refineFilter: {
      geo: {},
      owners: {},
      categories: {},
      domains: {},
    },
    details: {},
    allDetails: {},
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
    performance: {
      userFilter: {},
      contextFilter: {}
    },
    impressions: {},
    geo: {},
    devices: {},
    syndication: {},
  },
  category: {
    title: {},
    backBtn: {},
    export: {},
    refineFilter: {
      mediaType: {},
      playbackType: {},
      entrySource: {},
      tags: {},
      owners: {},
      context: {},
      categories: {},
      domains: {},
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
      userSearch: {},
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
    title: {},
    backBtn: {},
    owner: {},
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
    discovery: {
      userFilter: {}
    },
  },
  event: {
    title: {},
    backBtn: {},
    download: {},
    miniFunnel: {},
    miniProfile: {},
    miniMinutesViewed: {},
    miniReactions: {},
    miniMessages: {},
    miniEngagement: {},
    eventOverTime: {},
    sessions: {},
    contentOnDemand: {}
  },
  virtualEvent: {
    title: {},
    backBtn: {},
    download: {},
    details: {},
    refineFilter: {
      origin: {}
    },
    miniFunnel: {},
    miniOrigin: {},
    status : {},
    highlights: {},
    topDevices: {},
    geo: {},
    roles: {},
    industries: {}
  },
  entryWebcast: {
    export: {},
    title: {},
    backBtn: {},
    download: {},
    linkToLive: {},
    details: {},
    miniHighlights: {},
    miniEngagement: {
      questions: {},
      viewers: {},
      // download: {} // used by KMS only
    },
    miniQuality: {},
    highlights: {},
    liveEngagement: {},
    tools: {
      slides: {},
      polls: {},
      announcements: {},
      answers: {}
    },
    insights: {},
    entryPreview: {},
    userEngagement: {
      userFilter: {},
    },
    geo: {},
    devices: {},
    domains: {},
    refineFilter: {
      playbackType: {},
      owners: {},
      devices: {},
      browsers: {},
      domains: {},
      os: {},
      geo: {}
    }
  },
  entryEP: {
    download: {},
    title: {},
    backBtn: {},
    miniViewers: {},
    miniMinutesViewed: {},
    miniEngagement: {},
    miniPlays: {},
    recordings: {},
    polls: {},
    session: {},
    geo: {},
    devices: {}
  },
  playlist: {
    title: {},
    backBtn: {},
    export: {},
    videos: {},
    refineFilter: {
      mediaType: {},
      playbackType: {},
      entrySource: {},
      tags: {},
      owners: {},
      categories: {},
      domains: {},
      geo: {},
    },
    details: {},
    miniHighlights: {},
    miniTopVideos: {},
    miniTopViewers: {},
    miniInsights: {
      peakDay: {},
      domains: {},
      geo: {},
      devices: {}
    },
    totals: {},
    performance: {
      userDrilldown: {},
      userFilter: {},
      userLink: {},
      entryDrilldown: {},
      entryFilter: {},
      entryLink: {}
    },
    topVideos: {},
    geo: {},
    devices: {},
    syndication: {}
  },
  user: {
    title: {},
    backBtn: {},
    avatar: {},
    details: {},
    export: {},
    refineFilter: {
      mediaType: {},
      entrySource: {},
      tags: {},
      categories: {},
      domains: {},
    },
    totals: {
      entries: {},
      social: {}
    },
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
