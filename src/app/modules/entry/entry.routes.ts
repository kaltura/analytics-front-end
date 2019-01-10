import { Route } from '@angular/router';
import { EntryViewComponent } from './entry-view.component';

export const routing: Route[] = [
  {
    path: '', component: EntryViewComponent,
    children: [
      { path: 'entry', redirectTo: 'entry/:id', pathMatch: 'full' },
      { path: 'entry/:id', component: EntryViewComponent }
    ]
  }
];
