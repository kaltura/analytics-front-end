import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';
import { routing } from './event.routes';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, InputHelperModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { EventViewComponent } from "./event-view.component";
import { RegistrationFunnelComponent } from "./views/registration-funnel/registration-funnel.component";
import { MiniScoringComponent } from "./views/mini-scoring/mini-scoring.component";
import { EventMiniMinutesViewedComponent } from "./views/mini-minutes-viewed/mini-minutes-viewed.component";
import {EventMiniEngagementComponent} from "./views/mini-engagement/mini-engagement.component";
import {EventMiniReactionsComponent} from "./views/mini-reactions/mini-reactions.component";
import {EventMiniMessagesComponent} from "./views/mini-messages/mini-messages.component";

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
    EventViewComponent,
    RegistrationFunnelComponent,
    MiniScoringComponent,
    EventMiniMinutesViewedComponent,
    EventMiniEngagementComponent,
    EventMiniReactionsComponent,
    EventMiniMessagesComponent
  ],
  exports: [],
  providers: []
})

export class EventModule {
}
