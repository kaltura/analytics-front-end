import { Route } from '@angular/router';
import { UserEpViewComponent } from './user-ep-view.component';

export const routing: Route[] = [
  {
    path: '', component: UserEpViewComponent,
    children: [
      { path: 'user-ep', redirectTo: ':eventId/:userId/:userName', pathMatch: 'full' },
      { path: 'user-ep/:eventId/:userId/:userName', component: UserEpViewComponent }
    ]
  }
];
