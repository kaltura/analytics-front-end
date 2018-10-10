import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';
import { DashboardViewComponent } from '../modules/dashboard/dashboard-view.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
       {
          path: 'dashboard',
          component: DashboardViewComponent
      },
      {
        path: 'system', children: [
        { path: '', redirectTo: 'platforms', pathMatch: 'full' },
        {
          path: 'platforms',
          loadChildren: '../modules/system/views/platforms/platforms.module#PlatformsModule'
        }
      ]
      },
      {
        path: 'users', children: [
        { path: '', redirectTo: 'top-contributors', pathMatch: 'full' },
        {
          path: 'top-contributors',
          loadChildren: '../modules/users/views/top-contributors/top-contributors.module#TopContributorsModule'
        }
      ]
      },
      {
        path: 'bandwidth',
        loadChildren: '../modules/bandwidth//bandwidth.module#BandwidthModule'
      },
      {
        path: 'live', children: [
        { path: '', redirectTo: 'live-reports', pathMatch: 'full' },
        {
          path: 'live-reports',
          loadChildren: '../modules/live/views/live-reports/live-reports.module#LiveReportsModule'
        }
      ]
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class AppRoutingModule { }
