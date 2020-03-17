import { Route } from '@angular/router';
import { CategoryViewComponent } from './category-view.component';

export const routing: Route[] = [
  {
    path: '', component: CategoryViewComponent,
    children: [
      { path: 'category', redirectTo: 'category/:id', pathMatch: 'full' },
      { path: 'category/:id', component: CategoryViewComponent }
    ]
  }
];
