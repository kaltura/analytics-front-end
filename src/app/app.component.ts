import { Component, ViewChild, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { analyticsConfig, getKalturaServerUri } from '../configuration/analytics-config';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { KalturaClient } from 'kaltura-ngx-client';
import { TranslateService } from '@ngx-translate/core';
import { BrowserService } from './shared/services/browser.service';
import { ConfirmationService, ConfirmDialog } from 'primeng/primeng';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [KalturaLogger.createLogger('AppComponent')]
})
export class AppComponent implements OnInit {

  @ViewChild('confirm') private _confirmDialog: ConfirmDialog;
  @ViewChild('alert') private _alertDialog: ConfirmDialog;

  public _confirmDialogAlignLeft = false;
  public _confirmationLabels = {
    yes: 'Yes',
    no: 'No',
    ok: 'OK'
  };

  @HostListener('window:message', ['$event'])
  onMessage(e) {
    if (e.data && e.data.action) {
      if (e.data.action === 'navigate') {
        this._router.navigateByUrl(e.data.url);
      }
    }
  }

  constructor(private _translate: TranslateService,
              private _confirmationService: ConfirmationService,
              private _logger: KalturaLogger,
              private _router: Router,
              private _browserService: BrowserService,
              private _kalturaServerClient: KalturaClient) {
    this._initApp();
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
      },0);
    });
  }

  private _initApp(): void {
    const config = window['analyticsConfig'] || parent['analyticsConfig'] || null;
    if (config) {

      // populate analyticsConfig with configuration send from hosting app
      analyticsConfig.ks = config.ks;
      analyticsConfig.pid = config.pid;
      analyticsConfig.locale = config.locale;
      analyticsConfig.kalturaServer = config.kalturaServer;
      analyticsConfig.showNavBar = config.showNavBar;
      analyticsConfig.callbacks = config.callbacks;

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
      this._logger.info('Loading localization...');
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
    } else {
      this._initAppError('Error getting configuration from hosting app');
    }
  }

  private _initAppError(errorMsg: string): void{
    this._logger.error(errorMsg);
  }

  private _onInitSuccess(): void {
    // this._browserService.alert({message: 'Loaded!'});
  }

}
