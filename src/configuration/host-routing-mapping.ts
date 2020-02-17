export function mapRoutes(kmcRoute: string, queryParams: { [key: string]: string }, prevRoute: string): string {
  const idPostfix = queryParams && queryParams['id'] ? `/${queryParams['id']}` : '';
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
      analyticsRoute = '/live';
      break;
    case 'entry':
    case '/analytics/entry':
      analyticsRoute = `/entry${idPostfix}`;
      break;
    case 'category':
    case '/analytics/category':
      analyticsRoute = `/category${idPostfix}`;
      break;
    case 'playlist':
    case '/analytics/playlist':
      analyticsRoute = `/playlist${idPostfix}`;
      break;
    case 'entry-live':
    case '/analytics/entry-live':
      analyticsRoute = `/entry-live${idPostfix}`;
      break;
    case 'user':
    case '/analytics/user':
      const showContributions = prevRoute && prevRoute.indexOf('contributor') !== -1;
      const params = showContributions ? '?showContributions=true' : '';
      analyticsRoute = `/user${idPostfix}${params}`;
      break;
    default:
      break;
  }
  return analyticsRoute;
}
