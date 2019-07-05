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
        loadChildren: () => import('../modules/entry/entry.module').then(m => m.EntryModule)
      },
      {
        path: 'entry',
        loadChildren: () => import('../modules/entry/entry.module').then(m => m.EntryModule)
      },
      {
        path: 'entry-live/:id',
        loadChildren: () => import('../modules/entry-live/entry-live.module').then(m => m.EntryLiveModule)
      },
      {
        path: 'entry-live',
        loadChildren: () => import('../modules/entry-live/entry-live.module').then(m => m.EntryLiveModule)
      },
      {
        path: 'audience',
        loadChildren: () => import('../modules/audience/audience.module').then(m => m.AudienceModule)
      },
      {
        path: 'contributors',
        loadChildren: () => import('../modules/contributors/contributors.module').then(m => m.ContributorsModule)
      },
      {
        path: 'bandwidth',
        loadChildren: () => import('../modules/bandwidth/bandwidth.module').then(m => m.BandwidthModule)
      },
      {
        path: 'live',
        loadChildren: () => import('../modules/live/live.module').then(m => m.LiveModule)
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
