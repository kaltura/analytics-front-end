import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { NgxEchartsModule } from 'ngx-echarts';

import { routing } from './contributors.routes';
import { ContributorsComponent } from './contributors.component';

import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, PopupWidgetModule, TagsModule, TooltipModule, InputHelperModule } from '@kaltura-ng/kaltura-ui';
import { AutoCompleteModule } from '@kaltura-ng/kaltura-primeng-ui';
import { TableModule } from 'primeng/table';
import { topContributorsComponentsList } from './views/top-contributors/components-list';
import { CheckboxModule, OverlayPanelModule, PaginatorModule } from 'primeng/primeng';

@NgModule({
  imports: [
    AreaBlockerModule,
    AutoCompleteModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    DropdownModule,
    ButtonModule,
    SharedModule,
    TableModule,
    NgxEchartsModule,
    RouterModule.forChild(routing),
    TagsModule,
    InputHelperModule,
    PopupWidgetModule,
    CheckboxModule,
    PaginatorModule,
    TooltipModule,
    OverlayPanelModule,
  ],
  declarations: [
    ContributorsComponent,
    ...topContributorsComponentsList,
  ],
  exports: [],
  providers: []
})
export class ContributorsModule {
}
