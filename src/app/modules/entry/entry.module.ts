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
import { EntryTotalsComponent } from './views/entry-totals/entry-totals.component';
import { EntryPreviewComponent } from './views/entry-preview/entry-preview.component';
import { SharedModule } from 'shared/shared.module';
import { AreaBlockerModule, TagsModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { TableModule } from 'primeng/table';
import { VideoPerformanceComponent } from './views/video-performance/video-performance.component';
import { UserEngagementComponent } from './views/user-engagement/user-engagement.component';

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
  ],
  declarations: [
    EntryViewComponent,
    EntryTotalsComponent,
    EntryPreviewComponent,
    VideoPerformanceComponent,
    UserEngagementComponent,
  ],
  exports: [],
  providers: []
})
export class EntryModule {
}
