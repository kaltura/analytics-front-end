import { Route } from '@angular/router';
import { ExportComponent } from './export.component';

export const routing: Route[] = [
  {
    path: '', component: ExportComponent,
    children: [
      { path: 'export', redirectTo: 'export/:id', pathMatch: 'full' },
      { path: 'export/:id', component: ExportComponent }
    ]
  }
];
