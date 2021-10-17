import { Route } from '@angular/router';

import { BandwidthComponent } from './bandwidth.component';
import { PublisherStorageComponent } from './views/publisher-storage/publisher-storage.component';
import { EndUserStorageComponent } from './views/end-user/end-user-storage.component';
import { StorageComponent } from "./views/overview/storage.component";

export const routing: Route[] = [
  {
    path: '', component: BandwidthComponent,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      { path: 'overview', component: StorageComponent },
      { path: 'publisher', component: PublisherStorageComponent },
      { path: 'end-user', component: EndUserStorageComponent },
    ]
  }
];
