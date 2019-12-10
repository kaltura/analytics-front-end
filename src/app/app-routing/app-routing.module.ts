import { NgModule } from '@angular/core';
import { LocationStrategy, PathLocationStrategy, PlatformLocation } from '@angular/common';
import { VoidPathLocationStrategy } from './void-path-location-strategy';
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
        path: 'playlist/:id',
        loadChildren: () => import('../modules/playlist/playlist.module').then(m => m.PlaylistModule)
      },
      {
        path: 'playlist',
        loadChildren: () => import('../modules/playlist/playlist.module').then(m => m.PlaylistModule)
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

export const pathLocationStrategyFactory = (_platformLocation: PlatformLocation) => {
  // we use a factory since production build is compiled AOT and useClass cannot be conditional in AOT
  // the "loadInFriendlyIframe" global variable must be injected by the host app to the Analytics window scope (see example in analyticsLoaderFriendly.html)
  return window["loadInFriendlyIframe"] ? new VoidPathLocationStrategy(_platformLocation) : new PathLocationStrategy(_platformLocation);
}
@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  providers: [{ provide: LocationStrategy, useFactory: pathLocationStrategyFactory, deps: [PlatformLocation] }],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class AppRoutingModule { }
