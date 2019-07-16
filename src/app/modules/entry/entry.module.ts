import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';

import { routing } from './entry.routes';
import { EntryViewComponent } from './entry-view.component';
import { EntryTotalsComponent } from './views/video/entry-totals/entry-totals.component';
import { EntryPreviewComponent } from './views/video/entry-preview/entry-preview.component';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { VideoPerformanceComponent } from './views/video/video-performance/video-performance.component';
import { EntryFilterComponent } from './filter/filter.component';
import { EntryDevicesOverviewComponent } from './views/shared/devices-overview/devices-overview.component';
import { TopCountriesComponent } from './views/shared/top-countries/top-countries.component';
import { GeoComponent } from './views/shared/top-countries/geo/geo.component';
import { UserEngagementComponent } from './views/video/user-engagement/user-engagement.component';
import { HeatMapComponent } from './views/video/user-engagement/heat-map/heat-map.component';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { UserEngagementFilterComponent } from './views/video/user-engagement/filter/filter.component';
import { UsersFilterComponent } from './views/video/user-engagement/filter/users-filter/users-filter.component';
import { VideoEntryViewComponent } from './views/video/entry-view.component';


@NgModule({
  imports: [
    AreaBlockerModule,
    TagsModule,
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
    RouterModule.forChild(routing),
    AutoCompleteModule,
  ],
  declarations: [
    EntryViewComponent,
    EntryTotalsComponent,
    EntryPreviewComponent,
    VideoPerformanceComponent,
    EntryDevicesOverviewComponent,
    EntryFilterComponent,
    TopCountriesComponent,
    GeoComponent,
    UserEngagementComponent,
    HeatMapComponent,
    UsersFilterComponent,
    UserEngagementFilterComponent,
    VideoEntryViewComponent,
  ],
  exports: [],
  providers: []
})
export class EntryModule {
}
