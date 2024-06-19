import { Route } from '@angular/router';
import { EventViewComponent } from './event-view.component';

export const routing: Route[] = [
  {
    path: '', component: EventViewComponent,
    children: [
      { path: 'event', redirectTo: 'event/:id', pathMatch: 'full' },
      { path: 'event/:id', component: EventViewComponent }
    ]
  }
];
