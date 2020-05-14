import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';

import { routing } from './category.routes';
import { CategoryViewComponent } from './category-view.component';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, InputHelperModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { RadioButtonModule } from 'primeng/radiobutton';
import { UICarouselModule } from 'ng-carousel-iuno';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { CatFilterComponent } from "./filter/filter.component";
import { CategoryTopContentComponent, CategoryTopContentTableComponent, CategoryEntryDetailsOverlayComponent } from './views/category-top-content';
import { MiniTopVideosComponent } from "./views/mini-top-videos/mini-top-videos.component";
import { CategoryMiniTopViewersComponent } from "./views/mini-top-viewers/mini-top-viewers.component";
import { InsightDomainsComponent } from "./views/insight-domains/insight-domains.component";
import { InsightGeoComponent } from "./views/insight-geo/insight-geo.component";
import { InsightDevicesComponent } from "./views/insight-devices/insight-devices.component";
import { CategoryContextFilterComponent } from "./filter/context-filter/context-filter.component";
import { CategoryMiniPageViewsComponent } from "./views/mini-page-views/mini-page-views.component";
import { CategoryMiniHighlightsComponent } from "./views/mini-highlights/mini-highlights.component";
import { CategoryPerformanceComponent } from "./views/performance/performance.component";
import { UsersTableComponent } from "./views/performance/users-table/users-table.component";
import { EntriesTableComponent } from "./views/performance/entries-table/entries-table.component";
import { DatesTableComponent } from "./views/performance/dates-table/dates-table.component";
import { SubcategoriesComponent } from './views/subcategories/subcategories.component';
import { SubcategoryDetailsOverlayComponent } from "./views/subcategories/subcategory-details-overlay/subcategory-details-overlay.component";

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
    RadioButtonModule,
    TooltipModule,
    NgxEchartsModule,
    RouterModule.forChild(routing),
    AutoCompleteModule,
    InputHelperModule,
    UICarouselModule
  ],
  declarations: [
    CategoryViewComponent,
    CategoryMiniTopViewersComponent,
    CategoryMiniHighlightsComponent,
    MiniTopVideosComponent,
    InsightDomainsComponent,
    InsightGeoComponent,
    InsightDevicesComponent,
    CatFilterComponent,
    CategoryTopContentComponent,
    CategoryTopContentTableComponent,
    CategoryEntryDetailsOverlayComponent,
    CategoryContextFilterComponent,
    CategoryMiniPageViewsComponent,
    CategoryPerformanceComponent,
    UsersTableComponent,
    EntriesTableComponent,
    DatesTableComponent,
    SubcategoriesComponent,
    SubcategoryDetailsOverlayComponent
  ],
  exports: [],
  providers: []
})

export class CategoryModule {
}
