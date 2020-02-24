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

import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { CatFilterComponent } from "./filter/filter.component";
import { CategoryTopCountriesComponent } from "./views/top-countries/top-countries.component";
import { CategoryGeoComponent } from "./views/top-countries/geo/geo.component";

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
    InputHelperModule,
  ],
  declarations: [
    CategoryViewComponent,
    CategoryGeoComponent,
    CategoryTopCountriesComponent,
    CatFilterComponent
    // EntryFilterComponent,
    // ...sharedEntryDeclarations,
    // ...videoEntryDeclarations,
    // ...imageEntryDeclarations,
  ],
  exports: [],
  providers: []
})
export class CategoryModule {
}
