import { Route } from '@angular/router';
import { EntryEpViewComponent } from './entry-ep-view.component';

export const routing: Route[] = [
  {
    path: '', component: EntryEpViewComponent,
    children: [
      { path: 'entry-ep', redirectTo: 'entry-ep/:id', pathMatch: 'full' },
      { path: 'entry-ep/:id', component: EntryEpViewComponent }
    ]
  }
];
