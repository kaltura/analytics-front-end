import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { EndUserStorageComponent } from './end-user-storage.component';
import { routing } from './end-user-storage.routes';

@NgModule({
  imports: [
    RouterModule.forChild(routing)
  ],
  declarations: [EndUserStorageComponent]
})
export class EndUserStorageModule {
}
