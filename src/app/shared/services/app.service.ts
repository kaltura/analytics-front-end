import { Injectable, OnDestroy } from '@angular/core';
import { analyticsConfig, getKalturaServerUri, setConfig } from 'configuration/analytics-config';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaClient } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter } from 'rxjs/operators';
import { BrowserService } from 'shared/services/browser.service';
import { ConfirmationService } from 'primeng/api';
import { Router } from '@angular/router';
import { mapRoutes } from 'configuration/host-routing-mapping';

@Injectable()
export class AppService implements OnDestroy {
  public confirmDialogAlignLeft = false;
  public confirmationLabels = {
    yes: 'Yes',
    no: 'No',
    ok: 'OK'
  };
  
  constructor(private _logger: KalturaLogger,
              private _kalturaServerClient: KalturaClient,
              private _translate: TranslateService,
              private _browserService: BrowserService,
              private _confirmationService: ConfirmationService,
              private _router: Router,
              private _frameEventManager: FrameEventManagerService) {
    this._logger = _logger.subLogger('AppService');
  }
  
  ngOnDestroy(): void {
  }
  
  public init(): void {
    // set ks in ngx-client
    this._logger.info(`Setting ks in ngx-client: ${analyticsConfig.ks}`);
    this._kalturaServerClient.setOptions({
      endpointUrl: getKalturaServerUri(),
      clientTag: `kmc-analytics:${analyticsConfig.appVersion}`
    });
    this._kalturaServerClient.setDefaultRequestOptions({
      ks: analyticsConfig.ks
    });
    
    this._browserService.registerOnShowConfirmation((confirmationMessage) => {
      const htmlMessageContent = confirmationMessage.message.replace(/\r|\n/g, '<br/>');
      const formattedMessage = Object.assign(
        {},
        confirmationMessage,
        { message: htmlMessageContent },
        {
          accept: () => {
            this._frameEventManager.publish(FrameEvents.ModalClosed);
            if (typeof confirmationMessage.accept === 'function') {
              confirmationMessage.accept();
            }
          },
        },
        {
          reject: () => {
            this._frameEventManager.publish(FrameEvents.ModalClosed);
            if (typeof confirmationMessage.reject === 'function') {
              confirmationMessage.reject();
            }
          },
        }
      );
      
      if (confirmationMessage.alignMessage === 'byContent') {
        this.confirmDialogAlignLeft = confirmationMessage.message && /\r|\n/.test(confirmationMessage.message);
      } else {
        this.confirmDialogAlignLeft = confirmationMessage.alignMessage === 'left';
      }
      
      this._frameEventManager.publish(FrameEvents.ModalOpened);
      
      this._confirmationService.confirm(formattedMessage);
    });
  
    this._frameEventManager.listen(FrameEvents.UpdateConfig)
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(config => setConfig(config, true));
  
    this._frameEventManager.listen(FrameEvents.Navigate)
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(({ url }) => this._router.navigateByUrl(mapRoutes(url)));
  
    this._frameEventManager.listen(FrameEvents.SetLogsLevel)
      .pipe(cancelOnDestroy(this), filter(payload => payload && this._logger.isValidLogLevel(payload.level)))
      .subscribe(({ level }) => this._logger.setOptions({ level }));
    
    // load localization
    this._logger.info('Loading localization...');
    this._translate.setDefaultLang(analyticsConfig.locale);
    this._translate.use(analyticsConfig.locale).subscribe(
      () => {
        this._logger.info(`Localization loaded successfully for locale: ${analyticsConfig.locale}`);
        if (analyticsConfig.isHosted) {
          this._frameEventManager.publish(FrameEvents.AnalyticsInitComplete);
        }
      },
      (error) => {
        this._initAppError(error.message);
      }
    );
  }
  
  private _initAppError(errorMsg: string): void {
    this._logger.error(errorMsg);
  }
  
  
}

