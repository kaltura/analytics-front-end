import { Route } from '@angular/router';
import { LiveComponent } from './live.component';
import { LiveReportsComponent } from './views/live-reports/live-reports.component';
import { EntriesLiveComponent } from './views/entries-live/entries-live.component';
import { LiveReportsGuard } from './views/live-reports/live-reports.guard';
import { EntriesLiveGuard } from './views/entries-live/entries-live.guard';

export const routing: Route[] = [
  {
    // the default component is decided inside LiveComponent
    path: '', component: LiveComponent,
    children: [
      {
        path: 'live-reports',
        component: LiveReportsComponent,
        canActivate: [LiveReportsGuard],
      },
      {
        path: 'entries-live',
        component: EntriesLiveComponent,
        canActivate: [EntriesLiveGuard],
      }
    ]
  }
];
