import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';

import { routing } from './user.routes';
import { UserViewComponent } from './user-view.component';
import { AreaBlockerModule, TagsModule, TooltipModule, InputHelperModule } from '@kaltura-ng/kaltura-ui';
import { SharedModule } from 'shared/shared.module';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { UserFilterComponent } from './filter/filter.component';
import { UserTotalsComponent } from './views/user-totals/user-totals.component';
import { UserHighlightsTableComponent } from './views/user-highlights/table/table.component';
import { UserHighlightsComponent } from './views/user-highlights/highlights.component';
import { UserSourcesComponent } from './views/sources/sources.component';


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
    InputHelperModule,
    NgxEchartsModule,
    RouterModule.forChild(routing),
    AutoCompleteModule,
  ],
  declarations: [
    UserViewComponent,
    UserFilterComponent,
    UserTotalsComponent,
    UserHighlightsTableComponent,
    UserHighlightsComponent,
    UserSourcesComponent
  ],
  exports: [],
  providers: []
})
export class UserModule {
}
