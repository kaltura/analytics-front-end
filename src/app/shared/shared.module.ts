import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';

import { DateFilterComponent } from './components/date-filter/date-filter.component';
import { ThumbLoaderComponent } from './components/thumb-loader/thumb-loader.component';
import { DateFilterService } from './components/date-filter/date-filter.service';
import { UsersFilterComponent } from './components/users-filter/users-filter.component';
import { CountryFilterComponent } from './components/country-filter/country-filter.component';
import { ExportCsvComponent } from './components/export-csv/export-csv.component';
import { BulletComponent } from './components/bullet/bullet.component';
import { InsightsBulletComponent } from './components/insights-bullet/insights-bullet.component';
import { ReportService } from './services/report.service';
import { ReportTabsComponent } from './components/report-tabs/report-tabs.component';
import { TranslateModule } from '@ngx-translate/core';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { AreaBlockerModule, InputHelperModule, PopupWidgetModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { TimeUnitsComponent } from './components/date-filter/time-units.component';
import { CompareService } from 'shared/services/compare.service';
import { NavigationDrillDownService } from 'shared/services/navigation-drilldown.service';
import { TrendPipe } from 'shared/pipes/trend.pipe';
import { DeviceIconPipe } from 'shared/pipes/device-icon.pipe';
import { NumberFormatPipe } from 'shared/pipes/number-formatter';
import { TrendService } from 'shared/services/trend.service';
import { EntryTypePipe } from 'shared/pipes/entry-type.pipe';
import { MediaTypePipe } from 'shared/pipes/media-type.pipe';
import { DurationPipe } from 'shared/pipes/duration.pipe';
import { KalturaPlayerComponent } from 'shared/player';
import { OverlayComponent } from 'shared/components/overlay/overlay.component';
import { TrendValueComponent } from 'shared/components/trend-value/trend-value.component';
import { CategoriesSearchService } from 'shared/services/categories-search.service';
import { CategoriesTreeComponent } from 'shared/components/categories-tree/categories-tree.component';
import { CategoriesTreePropagationDirective } from 'shared/components/categories-tree/categories-tree-propagation.directive';
import { TreeModule } from 'primeng/tree';
import { CheckboxesListFilterComponent } from 'shared/components/checkboxes-list-filter/checkboxes-list-filter.component';
import { CategoryFilterComponent } from 'shared/components/category-filter/category-filter.component';
import { CategoriesSelectorComponent } from 'shared/components/category-filter/category-selector/categories-selector.component';
import { AutocompleteFilterComponent } from 'shared/components/autocomplete-filter/autocomplete-filter.component';
import { DropdownFilterComponent } from 'shared/components/dropdown-filter/dropdown-filter.component';
import { MiddleEllipsisDirective } from 'shared/directives/middle-ellipsis.directive';
import { FilterComponent } from './components/filter/filter.component';
import { TagsFilterComponent } from './components/filter/tags-filter/tags-filter.component';
import { PlaybackFilterComponent } from './components/filter/playback-filter/playback-filter.component';
import { OwnersFilterComponent } from './components/filter/owners-filter/owners-filter.component';
import { LocationFilterComponent } from './components/filter/location-filter/location-filter.component';
import { DomainsFilterComponent } from './components/filter/domains-filter/domains-filter.component';
import { BrowserImagePipe } from 'shared/pipes/browser-image.pipe';
import { ImpressionsComponent } from 'shared/components/impressions-report/impressions.component';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';
import { OsImagePipe } from 'shared/pipes/os-image.pipe';
import { SyndicationComponent } from 'shared/components/syndication-report/syndication.component';
import { TableModule } from 'primeng/table';
import { CompareMetricComponent } from 'shared/components/compare-metric/compare-metric.component';
import { HorizontalBarRowComponent } from 'shared/components/horizontal-bar-row/horizontal-bar-row.component';
import { HorizontalBarChartComponent } from 'shared/components/horizontal-bar-chart/horizontal-bar-chart.component';
import { ScrollTopOnPagingDirective } from 'shared/directives/scroll-top-on-paging.directive';
import { TableModeIconPipe } from 'shared/pipes/table-mode-icon.pipe';
import { StreamDurationPipe } from 'shared/pipes/stream-duration.pipe';
import { UserEngagementFilterComponent } from 'shared/components/user-engagement-filter/user-engagement-filter.component';
import { UserEngagementUsersFilterComponent } from 'shared/components/user-engagement-filter/users-filter/users-filter.component';
import { EvenTableHeightDirective } from 'shared/directives/even-table-height.directive';
import { HeatMapComponent } from 'shared/components/heat-map/heat-map.component';
import { EntryDetailsOverlayComponent } from 'shared/components/entry-details-overlay/entry-details-overlay.component';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { EntriesEngagementFilterComponent } from 'shared/components/entry-engagement-filter/entries-filter/entries-filter.component';
import { EntryEngagementFilterComponent } from 'shared/components/entry-engagement-filter/entry-engagement-filter.component';
import { ContextDetailsOverlayComponent } from 'shared/components/context-details-overlay/context-details-overlay.component';
import { CategoryFullNamePipe } from './pipes/category-full-name.pipe';
import { ContextTableFilterComponent } from 'shared/components/context-table-filter/context-table-filter.component';
import { ContextFilterComponent } from 'shared/components/context-table-filter/users-filter/context-filter.component';
import { DevicesOverviewComponent } from "shared/components/devices-report/devices-overview.component";
import { GeoComponent } from "shared/components/top-countries-report/geo/geo.component";
import { TopCountriesComponent } from "shared/components/top-countries-report/top-countries.component";
import { KalturaPlayerV7Component } from "shared/player-v7";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    CheckboxModule,
    SelectButtonModule,
    ToastModule,
    CalendarModule,
    RadioButtonModule,
    PopupWidgetModule,
    TooltipModule,
    AutoCompleteModule,
    TreeModule,
    AreaBlockerModule,
    DropdownModule,
    MultiSelectModule,
    TagsModule,
    InputHelperModule,
    NgxEchartsModule,
    PaginatorModule,
    TableModule,
  ],
  declarations: [
    GeoComponent,
    TopCountriesComponent,
    DateFilterComponent,
    DevicesOverviewComponent,
    ThumbLoaderComponent,
    UsersFilterComponent,
    CountryFilterComponent,
    DomainsFilterComponent,
    ReportTabsComponent,
    ExportCsvComponent,
    BulletComponent,
    InsightsBulletComponent,
    TimeUnitsComponent,
    TrendPipe,
    BrowserImagePipe,
    OsImagePipe,
    NumberFormatPipe,
    DeviceIconPipe,
    EntryTypePipe,
    MediaTypePipe,
    DurationPipe,
    OverlayComponent,
    TrendValueComponent,
    MiddleEllipsisDirective,
    CategoriesTreePropagationDirective,
    CategoriesTreeComponent,
    CheckboxesListFilterComponent,
    CategoryFilterComponent,
    CategoriesSelectorComponent,
    AutocompleteFilterComponent,
    DropdownFilterComponent,
    KalturaPlayerComponent,
    KalturaPlayerV7Component,
    ImpressionsComponent,
    SyndicationComponent,
    CompareMetricComponent,
    HorizontalBarRowComponent,
    HorizontalBarChartComponent,
    ScrollTopOnPagingDirective,
    TableModeIconPipe,
    StreamDurationPipe,
    EvenTableHeightDirective,
    FilterComponent,
    TagsFilterComponent,
    PlaybackFilterComponent,
    OwnersFilterComponent,
    LocationFilterComponent,
    UserEngagementUsersFilterComponent,
    UserEngagementFilterComponent,
    HeatMapComponent,
    EntryDetailsOverlayComponent,
    EntriesEngagementFilterComponent,
    EntryEngagementFilterComponent,
    ContextDetailsOverlayComponent,
    CategoryFullNamePipe,
    ContextFilterComponent,
    ContextTableFilterComponent,
  ],
  exports: [
    GeoComponent,
    TopCountriesComponent,
    DateFilterComponent,
    DevicesOverviewComponent,
    ThumbLoaderComponent,
    UsersFilterComponent,
    CountryFilterComponent,
    CountryFilterComponent,
    ReportTabsComponent,
    ExportCsvComponent,
    BulletComponent,
    InsightsBulletComponent,
    TimeUnitsComponent,
    TrendPipe,
    BrowserImagePipe,
    OsImagePipe,
    NumberFormatPipe,
    DeviceIconPipe,
    EntryTypePipe,
    MediaTypePipe,
    DurationPipe,
    OverlayComponent,
    TrendValueComponent,
    KalturaPlayerComponent,
    KalturaPlayerV7Component,
    MiddleEllipsisDirective,
    CategoriesTreePropagationDirective,
    CategoriesTreeComponent,
    CheckboxesListFilterComponent,
    CategoryFilterComponent,
    CategoriesSelectorComponent,
    DomainsFilterComponent,
    AutocompleteFilterComponent,
    DropdownFilterComponent,
    ImpressionsComponent,
    SyndicationComponent,
    CompareMetricComponent,
    HorizontalBarRowComponent,
    HorizontalBarChartComponent,
    ScrollTopOnPagingDirective,
    TableModeIconPipe,
    StreamDurationPipe,
    EvenTableHeightDirective,
    FilterComponent,
    TagsFilterComponent,
    PlaybackFilterComponent,
    OwnersFilterComponent,
    LocationFilterComponent,
    UserEngagementUsersFilterComponent,
    UserEngagementFilterComponent,
    HeatMapComponent,
    EntryDetailsOverlayComponent,
    EntryEngagementFilterComponent,
    ContextDetailsOverlayComponent,
    CategoryFullNamePipe,
    ContextFilterComponent,
    ContextTableFilterComponent,
  ],
  providers: [
  ]
})

export class SharedModule {
  static forRoot(): ModuleWithProviders<SharedModule> {
    return {
      ngModule: SharedModule,
      providers: <any[]>[
        DateFilterService,
        ReportService,
        CompareService,
        TrendService,
        NavigationDrillDownService,
        CategoriesSearchService,
      ]
    };
  }
}
