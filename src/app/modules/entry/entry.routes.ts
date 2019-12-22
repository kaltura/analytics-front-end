import { Route } from '@angular/router';
import { EntryViewComponent } from './entry-view.component';
import { EntryCanActivate } from "./entry-can-activate.service";

export const routing: Route[] = [
  {
    path: '', component: EntryViewComponent, canActivate: [EntryCanActivate],
    children: [
      { path: 'entry', redirectTo: 'entry/:id', pathMatch: 'full' },
      { path: 'entry/:id', component: EntryViewComponent }
    ]
  }
];
