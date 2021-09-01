import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { routing } from './export.routes';
import { ExportComponent } from './export.component';
import { AreaBlockerModule } from '@kaltura-ng/kaltura-ui';
import { ButtonModule } from 'primeng/button';

@NgModule({
  imports: [
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
