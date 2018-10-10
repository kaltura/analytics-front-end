import { Route } from '@angular/router';

import { ContributorsComponent } from './contributors.component';
import { TopContributorsComponent } from './views/top-contributors/top-contributors.component';

export const routing: Route[] = [
  {
    path: '', component: ContributorsComponent,
    children: [
      { path: '', redirectTo: 'top-contributors', pathMatch: 'full' },
      { path: 'top-contributors', component: TopContributorsComponent }
    ]
  }
];
