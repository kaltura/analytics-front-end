import { Route } from '@angular/router';
import { PlaylistViewComponent } from './playlist-view.component';

export const routing: Route[] = [
  {
    path: '', component: PlaylistViewComponent,
    children: [
      { path: 'playlist', redirectTo: 'playlist/:id', pathMatch: 'full' },
      { path: 'playlist/:id', component: PlaylistViewComponent }
    ]
  }
];
