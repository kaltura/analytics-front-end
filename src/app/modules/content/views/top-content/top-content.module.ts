import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TopContentComponent } from './top-content.component';
import { routing } from './top-content.routes';

@NgModule({
  imports: [
    RouterModule.forChild(routing)
  ],
  declarations: [TopContentComponent]
})
export class TopContentModule {
}
