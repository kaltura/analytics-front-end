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
        path: 'export/:id',
        loadChildren: () => import('../modules/export/export.module').then(m => m.ExportModule)
      },
      {
        path: 'export',
        loadChildren: () => import('../modules/export/export.module').then(m => m.ExportModule)
      },
      {
        path: 'category/:id',
        loadChildren: () => import('../modules/category/category.module').then(m => m.CategoryModule)
      },
      {
        path: 'category',
        loadChildren: () => import('../modules/category/category.module').then(m => m.CategoryModule)
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
        path: 'virtual-event/:id',
        loadChildren: () => import('../modules/virtual-event/virtual-event.module').then(m => m.VirtualEventModule)
      },
      {
        path: 'virtual-event',
        loadChildren: () => import('../modules/virtual-event/virtual-event.module').then(m => m.VirtualEventModule)
      },
      {
        path: 'event/:id',
        loadChildren: () => import('../modules/event/event.module').then(m => m.EventModule)
      },
      {
        path: 'event',
        loadChildren: () => import('../modules/event/event.module').then(m => m.EventModule)
      },
      {
        path: 'user/:id',
        loadChildren: () => import('../modules/user/user.module').then(m => m.UserModule)
      },
      {
        path: 'user',
        loadChildren: () => import('../modules/user/user.module').then(m => m.UserModule)
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
        path: 'entry-webcast/:id',
        loadChildren: () => import('../modules/entry-webcast/entry-webcast.module').then(m => m.EntryWebcastModule)
      },
      {
        path: 'entry-webcast',
        loadChildren: () => import('../modules/entry-webcast/entry-webcast.module').then(m => m.EntryWebcastModule)
      },
      {
        path: 'entry-ep/:id',
        loadChildren: () => import('../modules/entry-ep/entry-ep.module').then(m => m.EntryEpModule)
      },
      {
        path: 'entry-ep',
        loadChildren: () => import('../modules/entry-ep/entry-ep.module').then(m => m.EntryEpModule)
      },
      {
        path: 'user-ep/:eventId/:userId/:userName',
        loadChildren: () => import('../modules/user-ep/user-ep.module').then(m => m.UserEpModule)
      },
      {
        path: 'user-ep',
        loadChildren: () => import('../modules/user-ep/user-ep.module').then(m => m.UserEpModule)
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
  },
  { path: '**', component: DashboardComponent }
];

export const pathLocationStrategyFactory = (_platformLocation: PlatformLocation) => {
  // we use a factory since production build is compiled AOT and useClass cannot be conditional in AOT
  // the "loadInFriendlyIframe" global variable must be injected by the host app to the Analytics window scope (see example in analyticsLoaderFriendly.html)
  return window["loadInFriendlyIframe"] ? new VoidPathLocationStrategy(_platformLocation) : new PathLocationStrategy(_platformLocation);
};

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })
  ],
  providers: [{ provide: LocationStrategy, useFactory: pathLocationStrategyFactory, deps: [PlatformLocation] }],
  exports: [
    RouterModule
  ],
  declarations: []
})
export class AppRoutingModule { }
