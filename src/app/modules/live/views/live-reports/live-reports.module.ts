import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LiveReportsComponent } from './live-reports.component';
import { routing } from './live-reports.routes';

@NgModule({
  imports: [
    RouterModule.forChild(routing)
  ],
  declarations: [LiveReportsComponent]
})
export class LiveReportsModule {
}
