import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { routing } from './embed.routes';
import { AreaBlockerModule, KalturaUIModule, TooltipModule } from '@kaltura-ng/kaltura-ui';
import { EmbedComponent } from './views/embed.component';
import { TableModule } from 'primeng/table';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'shared/shared.module';
import { PaginatorModule } from 'primeng/paginator';
import { InputTextModule } from 'primeng/inputtext';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routing),
    KalturaUIModule,
    SharedModule,
    TableModule,
    PaginatorModule,
    TranslateModule,
    AreaBlockerModule,
    InputTextModule,
    TooltipModule,
  ],
  declarations: [
    EmbedComponent
  ],
  providers: []
})
export class EmbedModule {
}
