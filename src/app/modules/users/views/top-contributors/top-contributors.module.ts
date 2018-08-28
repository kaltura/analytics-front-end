import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TopContributorsComponent } from './top-contributors.component';
import { routing } from './top-contributors.routes';

@NgModule({
  imports: [
    RouterModule.forChild(routing)
  ],
  declarations: [TopContributorsComponent]
})
export class TopContributorsModule {
}
