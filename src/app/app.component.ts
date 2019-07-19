import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { menu } from './app-menu/app-menu.config';
import { AppService } from 'shared/services/app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [KalturaLogger.createLogger('AppComponent')]
})
export class AppComponent implements OnInit, OnDestroy {

  @ViewChild('confirm') private _confirmDialog: ConfirmDialog;
  @ViewChild('alert') private _alertDialog: ConfirmDialog;

  public _confirmDialogAlignLeft = false;
  public _confirmationLabels = {
    yes: 'Yes',
    no: 'No',
    ok: 'OK'
  };

  constructor(private _frameEventManager: FrameEventManagerService,
              private _translate: TranslateService,
              private _confirmationService: ConfirmationService,
              private _logger: KalturaLogger,
              private _router: Router,
              private _browserService: BrowserService,
              private _kalturaServerClient: KalturaClient,
              private _appService: AppService) {
    if (window['analyticsConfig']) { // standalone
      this._appService.init(window['analyticsConfig']);
    } else { // hosted
      this._frameEventManager.listen(FrameEvents.Init)
        .pipe(cancelOnDestroy(this), filter(Boolean))
        .subscribe(config => this._appService.init(config, true));
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
        this._confirmDialogAlignLeft = confirmationMessage.message && /\r|\n/.test(confirmationMessage.message);
      } else {
        this._confirmDialogAlignLeft = confirmationMessage.alignMessage === 'left';
      }

      this._frameEventManager.publish(FrameEvents.ModalOpened);

      this._confirmationService.confirm(formattedMessage);
    });

    this._frameEventManager.publish(FrameEvents.AnalyticsInit, { menuConfig: menu, viewsConfig: this._appService.viewsConfig });
  }
  
  ngOnDestroy() {

  }

  private mapRoutes(kmcRoute: string): string {
    let analyticsRoute = kmcRoute;
    switch (kmcRoute) {
      case 'contributors':
      case '/analytics/contributors':
        analyticsRoute = '/contributors/top-contributors';
        break;
      case 'technology':
      case '/analytics/technology':
        analyticsRoute = '/audience/technology';
        break;
      case 'geo-location':
      case '/analytics/geo-location':
        analyticsRoute = '/audience/geo-location';
        break;
      case 'content-interactions':
      case '/analytics/content-interactions':
        analyticsRoute = '/audience/content-interactions';
        break;
      case 'engagement':
      case '/analytics/engagement':
        analyticsRoute = '/audience/engagement';
        break;
      case 'publisher':
      case '/analytics/publisher':
        analyticsRoute = '/bandwidth/publisher';
        break;
      case 'enduser':
      case '/analytics/enduser':
        analyticsRoute = '/bandwidth/end-user';
        break;
      case 'live':
      case '/analytics/live':
        analyticsRoute = '/live/live-reports';
        break;
      case 'entry':
      case '/analytics/entry':
        analyticsRoute = '/entry';
        break;
      case 'entry-live':
      case '/analytics/entry-live':
        analyticsRoute = '/entry-live';
        break;
      default:
        break;
    }
    return analyticsRoute;
  }



}
