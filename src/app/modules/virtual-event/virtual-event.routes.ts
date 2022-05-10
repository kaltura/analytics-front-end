import { Route } from '@angular/router';
import { VirtualEventViewComponent } from './virtual-event-view.component';

export const routing: Route[] = [
  {
    path: '', component: VirtualEventViewComponent,
    children: [
      { path: 'virtual-event', redirectTo: 'virtual-event/:id', pathMatch: 'full' },
      { path: 'virtual-event/:id', component: VirtualEventViewComponent }
    ]
  }
];
