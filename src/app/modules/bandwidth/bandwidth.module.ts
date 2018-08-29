import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { CalendarModule } from 'primeng/calendar';

import { routing } from './bandwidth.routes';
import { BandwidthComponent } from './bandwidth.component';
import { PublisherStorageComponent } from './views/publisher-storage/publisher-storage.component';
import { EndUserStorageComponent } from './views/end-user/end-user-storage.component';
import { DateFilterComponent } from '../../shared/components/date-filter/date-filter.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    DropdownModule,
    CalendarModule,
    RouterModule.forChild(routing),
  ],
  declarations: [
    BandwidthComponent,
    PublisherStorageComponent,
    EndUserStorageComponent,
    DateFilterComponent
  ],
  exports: [],
  providers: []
})
export class BandwidthModule {
}
