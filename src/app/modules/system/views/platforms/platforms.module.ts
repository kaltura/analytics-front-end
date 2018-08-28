import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PlatformsComponent } from './platforms.component';
import { routing } from './platforms.routes';

@NgModule({
  imports: [
    RouterModule.forChild(routing)
  ],
  declarations: [PlatformsComponent]
})
export class PlatformsModule {
}
