import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';

import { routing } from './entry.routes';
import { EntryViewComponent } from './entry-view.component';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, InputHelperModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { EntryFilterComponent } from './filter/filter.component';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { declarations as sharedEntryDeclarations } from './views/shared/declaration';
import { declarations as imageEntryDeclarations } from './views/image/declaration';
import { declarations as videoEntryDeclarations } from './views/video/declaration';
import { EntryCanActivate } from './entry-can-activate.service';

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
    EntryViewComponent,
    EntryFilterComponent,
    ...sharedEntryDeclarations,
    ...videoEntryDeclarations,
    ...imageEntryDeclarations,
  ],
  exports: [],
  providers: [EntryCanActivate]
})
export class EntryModule {
}
