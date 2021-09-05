import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { routing } from './export.routes';
import { ExportComponent } from './export.component';
import { AreaBlockerModule } from '@kaltura-ng/kaltura-ui';
import { ButtonModule } from 'primeng/button';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    AreaBlockerModule,
    ButtonModule,
    RouterModule.forChild(routing)
  ],
  declarations: [
    ExportComponent
  ],
  exports: [],
  providers: []
})
export class ExportModule {
}
