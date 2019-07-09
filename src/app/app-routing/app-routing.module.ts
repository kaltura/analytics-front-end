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
        path: 'user/:id',
        loadChildren: '../modules/user/user.module#UserModule'
      },
      {
        path: 'user',
        loadChildren: '../modules/user/user.module#UserModule'
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
        path: 'live',
        loadChildren: '../modules/live/live.module#LiveModule'
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
