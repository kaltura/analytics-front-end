import { Component } from '@angular/core';
import { analyticsConfig, getKalturaServerUri } from '../configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaClient, KalturaMultiRequest, KalturaRequestOptions } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [KalturaLogger.createLogger('AppComponent')]
})
export class AppComponent {
  constructor(private _translate: TranslateService,
              private _logger: KalturaLogger,
              private _kalturaServerClient: KalturaClient) {
    this._initApp();
  }

  private _initApp():void{
    const config = window['analyticsConfig'] || parent['analyticsConfig'] || null;
    if (config) {

      // populate analyticsConfig with configuration send from hosting app
      analyticsConfig.ks = config.ks;
      analyticsConfig.pid = config.pid;
      analyticsConfig.locale = config.locale;
      analyticsConfig.kalturaServer = config.kalturaServer;

      // set ks in ngx-client
      this._logger.info(`Setting ks in ngx-client: ${analyticsConfig.ks}`);
      this._kalturaServerClient.setOptions({
        endpointUrl: getKalturaServerUri(),
        clientTag: 'analytics'
      });
      this._kalturaServerClient.setDefaultRequestOptions({
        ks: analyticsConfig.ks
      });

      // load localization
      this._logger.info("Loading localization...");
      this._translate.setDefaultLang(analyticsConfig.locale);
      this._translate.use(analyticsConfig.locale).subscribe(
        () => {
          this._logger.info(`Localization loaded successfully for locale: ${analyticsConfig.locale}`);
          this._onInitSuccess();
        },
        (error) => {
          this._initAppError(error.message);
        }
      );
    }else{
      this._initAppError("Error getting configuration from hosting app");
    }
  }

  private _initAppError(errorMsg: string): void{
    this._logger.error(errorMsg);
  }

  private _onInitSuccess():void{

  }

}
