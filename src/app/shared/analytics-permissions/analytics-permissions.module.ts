import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsPermissionsService } from './analytics-permissions.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  exports: []
})
export class AnalyticsPermissionsModule {
  static forRoot(): ModuleWithProviders<AnalyticsPermissionsModule> {
    return {
      ngModule: AnalyticsPermissionsModule,
      providers: [
        AnalyticsPermissionsService
      ],
    };
  }
}
