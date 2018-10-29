import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'ngx-echarts';

import { routing } from './audience.routes';
import { AudienceComponent } from './audience.component';
import { TechnologyComponent } from './views/technology/technology.component';
import { GeoLocationComponent } from './views/geo-location/geo-location.component';
import { EngagementComponent } from './views/engagement/engagement.component';
import { ContentInteractionsComponent } from './views/content-interactions/content-interactions.component';

import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { TableModule } from 'primeng/table';

@NgModule({
  imports: [
    AreaBlockerModule,
    TagsModule,
    TooltipModule,
    AutoCompleteModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    DropdownModule,
    ButtonModule,
    PaginatorModule,
    SharedModule,
    TableModule,
    NgxEchartsModule,
    RouterModule.forChild(routing),
  ],
  declarations: [
    AudienceComponent,
    TechnologyComponent,
    GeoLocationComponent,
    EngagementComponent,
    ContentInteractionsComponent
  ],
  exports: [],
  providers: []
})
export class AudienceModule {
}
