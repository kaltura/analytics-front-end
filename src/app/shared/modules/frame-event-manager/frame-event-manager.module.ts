import { ModuleWithProviders, NgModule, Optional, Self } from '@angular/core';
import { FrameEventManagerService } from 'shared/modules/frame-event-manager/frame-event-manager.service';

@NgModule({
  imports: [],
  declarations: [],
  exports: [],
  providers: []
})
export class FrameEventManagerModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: FrameEventManagerModule,
      providers: [
        FrameEventManagerService,
      ]
    };
  }
  
  constructor(@Optional() @Self() frameEventManager: FrameEventManagerService) {
    if (frameEventManager) {
      frameEventManager.init();
    }
  }
}
