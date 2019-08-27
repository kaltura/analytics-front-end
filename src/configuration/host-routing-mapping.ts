export function mapRoutes(kmcRoute: string): string {
  let analyticsRoute = kmcRoute;
  switch (kmcRoute) {
    case 'contributors':
    case '/analytics/contributors':
      analyticsRoute = '/contributors/top-contributors';
      break;
    case 'technology':
    case '/analytics/technology':
      analyticsRoute = '/audience/technology';
      break;
    case 'geo-location':
    case '/analytics/geo-location':
      analyticsRoute = '/audience/geo-location';
      break;
    case 'content-interactions':
    case '/analytics/content-interactions':
      analyticsRoute = '/audience/content-interactions';
      break;
    case 'engagement':
    case '/analytics/engagement':
      analyticsRoute = '/audience/engagement';
      break;
    case 'publisher':
    case '/analytics/publisher':
      analyticsRoute = '/bandwidth/publisher';
      break;
    case 'enduser':
    case '/analytics/enduser':
      analyticsRoute = '/bandwidth/end-user';
      break;
    case 'live':
    case '/analytics/live':
      analyticsRoute = '/live/live-reports';
      break;
    case 'entry':
    case '/analytics/entry':
      analyticsRoute = '/entry';
      break;
    case 'entry-live':
    case '/analytics/entry-live':
      analyticsRoute = '/entry-live';
      break;
    default:
      break;
  }
  return analyticsRoute;
}