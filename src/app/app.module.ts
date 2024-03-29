import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DashboardViewComponent } from './modules/dashboard/dashboard-view.component';
import { AppRoutingModule } from './app-routing/app-routing.module';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { KalturaClientModule, KalturaClientOptions, KalturaRequestOptionsArgs } from 'kaltura-ngx-client';
import { analyticsConfig, getKalturaServerUri } from '../configuration/analytics-config';
import { BrowserService, ErrorsManagerService, AuthService, AppAnalytics } from './shared/services';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMenuComponent } from './app-menu/app-menu.component';
import { SharedModule } from './shared/shared.module';
import { FrameEventManagerModule } from 'shared/modules/frame-event-manager/frame-event-manager.module';
import { KalturaLogger, KalturaLoggerModule } from '@kaltura-ng/kaltura-logger';
import { environment } from '../environments/environment';
import { PageScrollService } from 'ngx-page-scroll';
import { AnalyticsPermissionsModule } from 'shared/analytics-permissions/analytics-permissions.module';
import { AreaBlockerModule } from '@kaltura-ng/kaltura-ui';
import { OperationTagModule } from '@kaltura-ng/kaltura-common';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { AppService } from 'shared/services/app.service';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json?v=' + analyticsConfig.appVersion);
}

export function kalturaClientOptionsFactory(): KalturaClientOptions {

  return  {
    endpointUrl: getKalturaServerUri(),
    clientTag: 'kmcng',
    chunkFileSize: 5 * 1024 * 1024
  };
}
export function kalturaClientDefaultOptionsFactory(): KalturaRequestOptionsArgs {
  return  {};
}

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    DashboardViewComponent,
    AppMenuComponent
  ],
  imports: [
    AreaBlockerModule,
    OperationTagModule.forRoot(),
    BrowserModule,
    SharedModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    KalturaClientModule.forRoot(kalturaClientOptionsFactory, kalturaClientDefaultOptionsFactory),
    AnalyticsPermissionsModule.forRoot(),
    FrameEventManagerModule.forRoot(),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    ConfirmDialogModule,
    KalturaLoggerModule.forRoot('AnalyticsNG'),
  ],
  providers: [
    BrowserService,
    AppAnalytics,
    ErrorsManagerService,
    ConfirmationService,
    AuthService,
    PageScrollService,
    AppService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(_kalturaLogger: KalturaLogger) {
    if (environment.production) {
      _kalturaLogger.setOptions({ level: 'Error' });
    } else {
      _kalturaLogger.setOptions({ level: 'Warn' });
    }
  }
}
