import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from '../dashboard/dashboard.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: 'entry/:id',
        loadChildren: '../modules/entry/entry.module#EntryModule'
      },
      {
        path: 'entry',
        loadChildren: '../modules/entry/entry.module#EntryModule'
      },
      {
        path: 'entry-live/:id',
        loadChildren: '../modules/entry-live/entry-live.module#EntryLiveModule'
      },
      {
        path: 'entry-live',
        loadChildren: '../modules/entry-live/entry-live.module#EntryLiveModule'
      },
      {
        path: 'audience',
        loadChildren: '../modules/audience/audience.module#AudienceModule'
      },
      {
        path: 'contributors',
        loadChildren: '../modules/contributors/contributors.module#ContributorsModule'
      },
      {
        path: 'bandwidth',
        loadChildren: '../modules/bandwidth/bandwidth.module#BandwidthModule'
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
