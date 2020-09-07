import { Route } from '@angular/router';
import { EntryWebcastViewComponent } from './entry-webcast-view.component';

export const routing: Route[] = [
  {
    path: '', component: EntryWebcastViewComponent,
    children: [
      { path: 'entry-webcast', redirectTo: 'entry-webcast/:id', pathMatch: 'full' },
      { path: 'entry-webcast/:id', component: EntryWebcastViewComponent }
    ]
  }
];
