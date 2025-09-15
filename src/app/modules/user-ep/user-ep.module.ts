import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';
import { routing } from './user-ep.routes';
import { UserEpViewComponent } from './user-ep-view.component';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, InputHelperModule, TagsModule, TooltipModule, PopupWidgetModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { SelectButtonModule } from "primeng/selectbutton";
import { EventInteractivityComponent } from "./views/event-interactivity/event-interactivity.component";
import { UserDetailsComponent } from "./views/user-details/user-details.component";
import { MetricsCardsComponent } from "./views/metrics-cards/metrics-cards.component";
import { OtherEventsComponent } from "./views/other-events/other-events.component";
import { ContentOnDemandComponent } from "./views/content-on-demand/content-on-demand.component";
import { SessionsComponent } from "./views/sessions/sessions.component";
import { UserEngagementComponent } from "./views/sessions/user-engagement/user-engagement.component";
import { EpUserMinutesViewedComponent } from "./views/minutes-viewed/minutes-viewed.component";
import { UserAttachmentsComponent } from "./views/attachments/attachments.component";
import {EpUserPollsComponent} from "./views/polls/polls.component";

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
    SelectButtonModule,
    SharedModule,
    TableModule,
    TooltipModule,
    PopupWidgetModule,
    NgxEchartsModule,
    RouterModule.forChild(routing),
    AutoCompleteModule,
    OverlayPanelModule,
    InputHelperModule,
  ],
  declarations: [
    UserEpViewComponent,
    EventInteractivityComponent,
    UserDetailsComponent,
    MetricsCardsComponent,
    OtherEventsComponent,
    ContentOnDemandComponent,
    SessionsComponent,
    UserEngagementComponent,
    EpUserMinutesViewedComponent,
    UserAttachmentsComponent,
    EpUserPollsComponent
  ],
  exports: [],
  providers: []
})
export class UserEpModule {
}
