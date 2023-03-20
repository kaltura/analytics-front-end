import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { PaginatorModule } from 'primeng/paginator';
import { NgxEchartsModule } from 'shared/ngx-echarts/ngx-echarts.module';

import { routing } from './entry-ep.routes';
import { EntryEpViewComponent } from './entry-ep-view.component';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, InputHelperModule, TagsModule, TooltipModule, PopupWidgetModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { OverlayPanelModule } from 'primeng/overlaypanel';

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
    PopupWidgetModule,
    NgxEchartsModule,
    RouterModule.forChild(routing),
    AutoCompleteModule,
    OverlayPanelModule,
    InputHelperModule,
  ],
  declarations: [
    EntryEpViewComponent
  ],
  exports: [],
  providers: []
})
export class EntryEpModule {
}
