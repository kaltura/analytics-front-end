import { Route } from '@angular/router';
import { UserViewComponent } from './user-view.component';

export const routing: Route[] = [
  {
    path: '', component: UserViewComponent,
    children: [
      { path: 'user', redirectTo: 'user/:id', pathMatch: 'full' },
      { path: 'user/:id', component: UserViewComponent }
    ]
  }
];
