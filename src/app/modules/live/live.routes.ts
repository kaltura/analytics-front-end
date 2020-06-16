import { Route } from '@angular/router';
import { LiveEntriesComponent } from './views/live-entries/live-entries.component';

export const routing: Route[] = [
  {
    path: '', component: LiveEntriesComponent,
  }
];
