import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import { Router } from '@angular/router';
import { analyticsConfig, getKalturaServerUri } from 'configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaClient } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { BrowserService } from 'shared/services';
import { ConfirmationService, ConfirmDialog } from 'primeng/primeng';
import { FrameEventManagerService, FrameEvents } from 'shared/modules/frame-event-manager/frame-event-manager.service';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [KalturaLogger.createLogger('AppComponent')]
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('confirm') private _confirmDialog: ConfirmDialog;
  @ViewChild('alert') private _alertDialog: ConfirmDialog;

  public _windowEventListener = null;
  public _confirmDialogAlignLeft = false;
  public _confirmationLabels = {
    yes: 'Yes',
    no: 'No',
    ok: 'OK'
  };

  private hosted = false;

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _confirmationService: ConfirmationService,
              private _logger: KalturaLogger,
              private _router: Router,
              private _browserService: BrowserService,
              private _kalturaServerClient: KalturaClient) {
    if (window['analyticsConfig']) { // standalone
      this._initApp(window['analyticsConfig']);
    } else { // hosted
      this._frameEventManager.listen(FrameEvents.Init)
        .pipe(cancelOnDestroy(this), filter(Boolean))
        .subscribe(config => this._initApp(config, true));
    }
    
    this._frameEventManager.listen(FrameEvents.Navigate)
      .pipe(cancelOnDestroy(this), filter(Boolean))
      .subscribe(({ url }) => this._router.navigateByUrl(this.mapRoutes(url)));
  
    this._frameEventManager.listen(FrameEvents.SetLogsLevel)
      .pipe(cancelOnDestroy(this), filter(payload => payload && this._logger.isValidLogLevel(payload.level)))
      .subscribe(({ level }) => _logger.setOptions({ level }));
  }

  ngOnInit() {
    this._browserService.registerOnShowConfirmation((confirmationMessage) => {
      const htmlMessageContent = confirmationMessage.message.replace(/\r|\n/g, '<br/>');
      const formattedMessage = Object.assign({}, confirmationMessage, {message: htmlMessageContent});

      if (confirmationMessage.alignMessage === 'byContent') {
        this._confirmDialogAlignLeft = confirmationMessage.message && /\r|\n/.test(confirmationMessage.message);
      } else {
        this._confirmDialogAlignLeft = confirmationMessage.alignMessage === 'left';
      }

      this._confirmationService.confirm(formattedMessage);
      // fix for PrimeNG no being able to calculate the correct content height
      setTimeout(() => {
        const dialog: ConfirmDialog = (confirmationMessage.key && confirmationMessage.key === 'confirm') ? this._confirmDialog : this._alertDialog;
        dialog.center();
      }, 0);
    });

    this._frameEventManager.publish(FrameEvents.AnalyticsInit);
  }
  
  ngOnDestroy() {

  }

  private _initApp(config = null, hosted = false): void {
    if (!config) {
      return;
    }

    this.hosted = hosted; // hosted;
    
    analyticsConfig.ks = config.ks;
    analyticsConfig.pid = config.pid;
    analyticsConfig.locale = config.locale;
    analyticsConfig.kalturaServer = config.kalturaServer;
    analyticsConfig.cdnServers = config.cdnServers;
    analyticsConfig.liveAnalytics = config.liveAnalytics;
    analyticsConfig.showNavBar = !this.hosted;
    analyticsConfig.isHosted = this.hosted;

    // set ks in ngx-client
    this._logger.info(`Setting ks in ngx-client: ${analyticsConfig.ks}`);
    this._kalturaServerClient.setOptions({
      endpointUrl: getKalturaServerUri(),
      clientTag: 'kmc-analytics:v0.1'
    });
    this._kalturaServerClient.setDefaultRequestOptions({
      ks: analyticsConfig.ks
    });

    // load localization
    this._logger.info('Loading localization...');
    this._translate.setDefaultLang(analyticsConfig.locale);
    this._translate.use(analyticsConfig.locale).subscribe(
      () => {
        this._logger.info(`Localization loaded successfully for locale: ${analyticsConfig.locale}`);
        if (this.hosted) {
          this._frameEventManager.publish(FrameEvents.AnalyticsInitComplete);
        }
      },
      (error) => {
        this._initAppError(error.message);
      }
    );
  }

  private _initAppError(errorMsg: string): void{
    this._logger.error(errorMsg);
  }

  private mapRoutes(kmcRoute: string): string {
    let analyticsRoute = kmcRoute;
    switch (kmcRoute) {
      case '/analytics/contributors':
        analyticsRoute = '/contributors/top-contributors';
        break;
      case '/analytics/technology':
        analyticsRoute = '/audience/technology';
        break;
      case '/analytics/geo-location':
        analyticsRoute = '/audience/geo-location';
        break;
      case '/analytics/content-interactions':
        analyticsRoute = '/audience/content-interactions';
        break;
      case '/analytics/engagement':
        analyticsRoute = '/audience/engagement';
        break;
      case '/analytics/publisher':
        analyticsRoute = '/bandwidth/publisher';
        break;
      case '/analytics/enduser':
        analyticsRoute = '/bandwidth/end-user';
        break;
      case '/analytics/live':
        analyticsRoute = '/live/live-reports';
        break;
      case '/analytics/entry':
        analyticsRoute = '/entry';
        break;
      default:
        break;
    }
    return analyticsRoute;
  }



}
