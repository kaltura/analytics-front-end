import { Route } from '@angular/router';

import { AudienceComponent } from './audience.component';
import { TechnologyComponent } from './views/technology/technology.component';
import { GeoLocationComponent } from './views/geo-location/geo-location.component';
import { EngagementComponent } from './views/engagement/engagement.component';
import { ContentInteractionsComponent } from './views/content-interactions/content-interactions.component';

export const routing: Route[] = [
  {
    path: '', component: AudienceComponent,
    children: [
      { path: '', redirectTo: 'technology', pathMatch: 'full' },
      { path: 'technology', component: TechnologyComponent },
      { path: 'geo-location', component: GeoLocationComponent },
      { path: 'engagement', component: EngagementComponent },
      { path: 'content-interactions', component: ContentInteractionsComponent }
    ]
  }
];
