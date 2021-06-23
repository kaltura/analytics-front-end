import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { routing } from './user.routes';
import { UserViewComponent } from './user-view.component';
import { AreaBlockerModule, InputHelperModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { SharedModule } from 'shared/shared.module';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { UserFilterComponent } from './filter/filter.component';
import { UserTotalsComponent } from './views/user-totals/user-totals.component';
import { UserHighlightsTableComponent } from './views/user-highlights/table/table.component';
import { UserHighlightsComponent } from './views/user-highlights/highlights.component';
import { UserSourcesComponent } from './views/sources/sources.component';
import { UICarouselModule } from 'ng-carousel-iuno';
import { UserMiniTopContentComponent } from './views/user-mini-top-content/user-mini-top-content.component';
import { TopContentTableComponent } from './views/user-top-content/top-content-table/top-content-table.component';
import { TopContentComponent } from './views/user-top-content/top-content.component';
import { UserMiniHighlightsComponent } from './views/user-mini-highlights/user-mini-highlights.component';
import { UserImpressionsComponent } from './views/user-impressions/user-impressions.component';
import { GeoComponent } from './views/user-mini-highlights/geo/geo.component';
import { DevicesComponent } from './views/user-mini-highlights/devices/devices.component';
import { UserInsightSourceComponent } from './views/user-insight-source/user-insight-source.component';
import { UserMediaUploadComponent } from './views/user-media-upload/user-media-upload.component';
import { UserMediaUploadTableComponent } from './views/user-media-upload/table/table.component';
import { UserInsightDomainComponent } from './views/user-insight-domain/user-insight-domain.component';
import { UserInsightMinutesViewedComponent } from './views/user-insight-minutes-viewed/user-insight-minutes-viewed.component';
import { UserInsightPlaysComponent } from './views/user-insight-plays/user-insight-plays.component';
import { UserEntryDetailsOverlayComponent } from './components/entry-details-overlay/entry-details-overlay.component';


@NgModule({
  imports: [
    AreaBlockerModule,
    TagsModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    DropdownModule,
    ButtonModule,
    OverlayPanelModule,
    PaginatorModule,
    SharedModule,
    TableModule,
    TooltipModule,
    InputHelperModule,
    NgxEchartsModule,
    RouterModule.forChild(routing),
    AutoCompleteModule,
    UICarouselModule,
  ],
  declarations: [
    UserViewComponent,
    UserFilterComponent,
    UserTotalsComponent,
    UserHighlightsTableComponent,
    UserHighlightsComponent,
    UserSourcesComponent,
    TopContentTableComponent,
    TopContentComponent,
    UserMiniTopContentComponent,
    UserMiniHighlightsComponent,
    UserImpressionsComponent,
    GeoComponent,
    DevicesComponent,
    UserInsightSourceComponent,
    UserMediaUploadComponent,
    UserMediaUploadTableComponent,
    UserInsightDomainComponent,
    UserInsightMinutesViewedComponent,
    UserInsightPlaysComponent,
    UserEntryDetailsOverlayComponent,
  ],
  exports: [],
  providers: []
})
export class UserModule {
}
