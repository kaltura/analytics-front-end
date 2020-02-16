import { Route } from '@angular/router';
import { EmbedComponent } from './views/embed.component';

export const routing: Route[] = [
  {
    path: '', component: EmbedComponent,
    children: [
      { path: 'embed', component: EmbedComponent }
    ]
  }
];
