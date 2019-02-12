import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CheckboxModule } from 'primeng/checkbox';
import { CalendarModule } from 'primeng/calendar';
import { SelectButtonModule } from 'primeng/selectbutton';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';

import { DateFilterComponent } from './components/date-filter/date-filter.component';
import { DateFilterService } from './components/date-filter/date-filter.service';
import { UsersFilterComponent } from './components/users-filter/users-filter.component';
import { ExportCsvComponent } from './components/export-csv/export-csv.component';
import { BulletComponent } from './components/bullet/bullet.component';
import { ReportService } from './services/report.service';
import { ReportTabsComponent } from './components/report-tabs/report-tabs.component';
import { TranslateModule } from '@ngx-translate/core';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { AreaBlockerModule, InputHelperModule, PopupWidgetModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { TimeUnitsComponent } from './components/date-filter/time-units.component';
import { CompareService } from 'shared/services/compare.service';
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
import { DropdownModule, MultiSelectModule } from 'primeng/primeng';
import { DropdownFilterComponent } from 'shared/components/dropdown-filter/dropdown-filter.component';
import { MiddleEllipsisDirective } from 'shared/directives/middle-ellipsis.directive';
import { components as FilterComponentsList } from 'shared/components/filter/components-list';
import { BrowserImagePipe } from 'shared/pipes/browser-image.pipe';
import { ImpressionsComponent } from 'shared/components/impressions-report/impressions.component';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';
import { SyndicationComponent } from 'shared/components/syndication-report/syndication.component';

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
  ],
  declarations: [
    DateFilterComponent,
    UsersFilterComponent,
    ReportTabsComponent,
    ExportCsvComponent,
    BulletComponent,
    TimeUnitsComponent,
    TrendPipe,
    BrowserImagePipe,
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
    ImpressionsComponent,
    SyndicationComponent,
    ...FilterComponentsList,
  ],
  exports: [
    DateFilterComponent,
    UsersFilterComponent,
    ReportTabsComponent,
    ExportCsvComponent,
    BulletComponent,
    TimeUnitsComponent,
    TrendPipe,
    BrowserImagePipe,
    NumberFormatPipe,
    DeviceIconPipe,
    EntryTypePipe,
    MediaTypePipe,
    DurationPipe,
    OverlayComponent,
    TrendValueComponent,
    KalturaPlayerComponent,
    MiddleEllipsisDirective,
    CategoriesTreePropagationDirective,
    CategoriesTreeComponent,
    CheckboxesListFilterComponent,
    CategoryFilterComponent,
    CategoriesSelectorComponent,
    AutocompleteFilterComponent,
    DropdownFilterComponent,
    ImpressionsComponent,
    SyndicationComponent,
    ...FilterComponentsList,
  ],
  providers: [
  ]
})

export class SharedModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: SharedModule,
      providers: <any[]>[
        DateFilterService,
        ReportService,
        CompareService,
        TrendService,
        CategoriesSearchService,
      ]
    };
  }
}
