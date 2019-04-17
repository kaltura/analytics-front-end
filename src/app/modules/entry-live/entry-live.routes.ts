import { Route } from '@angular/router';
import { EntryLiveViewComponent } from './entry-live-view.component';

export const routing: Route[] = [
  {
    path: '', component: EntryLiveViewComponent,
    children: [
      { path: 'entry-live', redirectTo: 'entry-live/:id', pathMatch: 'full' },
      { path: 'entry-live/:id', component: EntryLiveViewComponent }
    ]
  }
];
