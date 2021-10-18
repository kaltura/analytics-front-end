import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';

import { routing } from './bandwidth.routes';
import { BandwidthComponent } from './bandwidth.component';
import { PublisherStorageComponent } from './views/publisher-storage/publisher-storage.component';
import { EndUserStorageComponent } from './views/end-user/end-user-storage.component';
import { StorageComponent } from './views/overview/storage.component';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, PopupWidgetModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { TableModule } from 'primeng/table';
import { EndUserFilterComponent } from './views/end-user/filter/filter.component';
import { StorageFilterComponent } from './views/overview/filter/filter.component';
import { OverviewDateFilterComponent } from "./views/overview/overview-date-filter/overview-date-filter.component";
import { RadioButtonModule } from "primeng/radiobutton";

@NgModule({
  imports: [
    AreaBlockerModule,
    TagsModule,
    AutoCompleteModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    DropdownModule,
    ButtonModule,
    PaginatorModule,
    SharedModule,
    TableModule,
    TooltipModule,
    NgxEchartsModule,
    PopupWidgetModule,
    RadioButtonModule,
    RouterModule.forChild(routing),
  ],
  declarations: [
    BandwidthComponent,
    PublisherStorageComponent,
    EndUserStorageComponent,
    EndUserFilterComponent,
    StorageComponent,
    StorageFilterComponent,
    OverviewDateFilterComponent
  ],
  exports: [],
  providers: []
})
export class BandwidthModule {
}
