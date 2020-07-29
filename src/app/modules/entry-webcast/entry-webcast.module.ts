import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';

import { routing } from './entry-webcast.routes';
import { EntryWebcastViewComponent } from './entry-webcast-view.component';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, InputHelperModule, TagsModule, TooltipModule, PopupWidgetModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { EntryWebcastFilterComponent } from './filter/filter.component';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { DeviceFilterComponent } from "./filter/device-filter/device-filter.component";
import { BrowserFilterComponent } from "./filter/browser-filter/browser-filter.component";
import { OsFilterComponent } from "./filter/os-filter/os-filter.component";
import { WebcastMiniHighlightsComponent } from "./views/mini-highlights/mini-highlights.component";
import { WebcastGeoComponent } from "./views/geo/geo-location.component";
import { WebcastMiniQualityComponent } from "./views/mini-quality/mini-quality.component";
import { WebcastMinInsightsComponent } from "./views/mini-insights/mini-insights.component";
import { WebcastMiniEngagementComponent } from "./views/mini-engagement/mini-engagement.component";
import { WebcastMiniEngagementToolsComponent } from "./views/mini-engagement-tools/mini-engagement-tools.component";
import { WebcastDomainsComponent } from "./views/domains/domains.component";
import { WebcastDevicesComponent } from "./views/devices/devices.component";

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
    PopupWidgetModule,
    NgxEchartsModule,
    RouterModule.forChild(routing),
    AutoCompleteModule,
    InputHelperModule,
  ],
  declarations: [
    EntryWebcastViewComponent,
    EntryWebcastFilterComponent,
    DeviceFilterComponent,
    BrowserFilterComponent,
    OsFilterComponent,
    WebcastMiniHighlightsComponent,
    WebcastMiniEngagementComponent,
    WebcastMiniQualityComponent,
    WebcastMiniEngagementToolsComponent,
    WebcastMinInsightsComponent,
    WebcastGeoComponent,
    WebcastDevicesComponent,
    WebcastDomainsComponent
  ],
  exports: [],
  providers: []
})
export class EntryWebcastModule {
}
