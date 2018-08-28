import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PublisherStorageComponent } from './publisher-storage.component';
import { routing } from './publisher-storage.routes';

@NgModule({
  imports: [
    RouterModule.forChild(routing)
  ],
  declarations: [PublisherStorageComponent]
})
export class PublisherStorageModule {
}
