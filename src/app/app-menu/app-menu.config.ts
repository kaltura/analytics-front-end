export const menu = [
  {
    id: 'audience',
    link: 'audience',
    label: 'app.modules.audience',
    items: [
      {
        id: 'engagement',
        link: 'audience/engagement',
        label: 'app.audience.menu.engagement',
      },
      {
        id: 'content-interactions',
        link: 'audience/content-interactions',
        label: 'app.audience.menu.contentInteractions',
      },
      {
        id: 'technology',
        link: 'audience/technology',
        label: 'app.audience.menu.technology',
      },
      {
        id: 'geo-location',
        link: 'audience/geo-location',
        label: 'app.audience.menu.geoLocation',
      },
    ]
  },
  {
    id: 'contributors',
    link: 'contributors',
    label: 'app.modules.contributors',
  },
  {
    id: 'bandwidth',
    link: 'bandwidth',
    label: 'app.modules.bandwidth',
    items: [
      {
        id: 'overview',
        link: 'bandwidth/overview',
        label: 'app.bandwidth.overview',
      },
      {
        id: 'publisher',
        link: 'bandwidth/publisher',
        label: 'app.bandwidth.publisherStorage',
      },
      {
        id: 'end-user',
        link: 'bandwidth/end-user',
        label: 'app.bandwidth.usersStorage',
      },
    ]
  },
  {
    id: 'live',
    link: 'live',
    label: 'app.modules.live',
  },
];
