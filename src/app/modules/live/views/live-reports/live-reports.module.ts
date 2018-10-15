import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LiveReportsComponent } from './live-reports.component';
import { routing } from './live-reports.routes';
import { KalturaUIModule } from '@kaltura-ng/kaltura-ui';

@NgModule({
  imports: [
    RouterModule.forChild(routing),
    KalturaUIModule
  ],
  declarations: [
    LiveReportsComponent
  ]
})
export class LiveReportsModule {
}
