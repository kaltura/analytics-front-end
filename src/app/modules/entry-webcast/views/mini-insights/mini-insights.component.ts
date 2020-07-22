import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { TranslateService } from '@ngx-translate/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import {cancelOnDestroy} from "@kaltura-ng/kaltura-common";
import {BehaviorSubject} from "rxjs";
import {KalturaAPIException} from "kaltura-ngx-client";


@Component({
  selector: 'app-webcast-mini-insights',
  templateUrl: './mini-insights.component.html',
  styleUrls: ['./mini-insights.component.scss'],
  providers: [
    KalturaLogger.createLogger('WebcastMiniInsightsComponent')
  ]
})
export class WebcastMinInsightsComponent implements OnDestroy, OnInit {
  private _insights$: BehaviorSubject<{ minutesViewed: {total: number, live: number}, busy: boolean, error: KalturaAPIException }>
  @Input() set insights(insights$: any) {
    if (insights$) {
      this._insights$ = insights$;
      this._insights$
        .pipe(cancelOnDestroy(this))
        .subscribe(( data: { minutesViewed: {total: number, live: number}, busy: boolean, error: KalturaAPIException }) => {
          this._isBusy = data.busy;
          if (data.error) {
            const actions = {
              'close': () => {
                this._blockerMessage = null;
              }
            };
            this._blockerMessage = this._errorsManager.getErrorMessage(data.error, actions);
          } else if (data.minutesViewed) {
            const { live, total } = data.minutesViewed;
            const vod = total - live;
            // render bar graph
          }
        },
        error => {
          this._isBusy = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });
    }
  }

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;

  constructor(private _translate: TranslateService,
              private _errorsManager: ErrorsManagerService,
              private _logger: KalturaLogger) {
  }

  ngOnInit(): void {

  }

  ngOnDestroy(): void {
  }

}
