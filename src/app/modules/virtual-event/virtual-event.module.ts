import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';
import { routing } from './virtual-event.routes';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, InputHelperModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import {VirtualEventViewComponent} from "./virtual-event-view.component";
import {VirtualEventFilterComponent} from "./filter/filter.component";
import {RegistrationFunnelComponent} from "./views/registration-funnel/registration-funnel.component";
import {VEMiniInsightsComponent} from "./views/mini-insights/mini-insights.component";


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
    InputHelperModule
  ],
  declarations: [
    VirtualEventViewComponent,
    VirtualEventFilterComponent,
    RegistrationFunnelComponent,
    VEMiniInsightsComponent
  ],
  exports: [],
  providers: []
})

export class VirtualEventModule {
}
