import { Component, OnInit, OnDestroy } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService, ErrorDetails, AuthService } from 'shared/services';
import { KalturaClient, KalturaReportInputFilter, KalturaReportType, ReportGetTotalAction } from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { AreaBlockerMessage, AreaBlockerMessageButton } from '@kaltura-ng/kaltura-ui';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './publisher-storage.component.html',
  styleUrls: ['./publisher-storage.component.scss']
})
export class PublisherStorageComponent implements OnInit, OnDestroy {

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _metrics: SelectItem[] = [];
  public _selectedMetrics = 'bandwidth_consumption';

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public result = '';

  private filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  constructor(private _translate: TranslateService,
              private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService,
              private _authService: AuthService ) { }

  ngOnInit() {
    this._isBusy = false;
    const metrics: string[] = ['bandwidth_consumption', 'average_storage', 'peak_storage', 'added_storage', 'deleted_storage', 'combined_bandwidth_storage', 'transcoding_consumption'];
    metrics.forEach( key => {
      this._metrics.push({label: this._translate.instant(key), value: key});
    });
  }

  ngOnDestroy() {

  }

  public onDateFilterChange(event: DateChangeEvent): void {
    this.filter.timeZoneOffset = event.timeZoneOffset;
    this.filter.fromDay = event.startDay;
    this.filter.toDay = event.endDay;
    this.filter.interval = event.timeUnits;
    this.loadReport();
  }

  public onMetricsChange(event): void {
    // debugger;
  }

  private loadReport(): void {
    this._isBusy = true;
    this._blockerMessage = null;
    const getTotal = new ReportGetTotalAction({
      reportType: KalturaReportType.partnerUsage,
      reportInputFilter: this.filter
    });

    this._kalturaClient.request(getTotal).pipe(cancelOnDestroy(this))
      .subscribe(response => {
        this.result = JSON.stringify(response);
        this._isBusy = false;
      },
      error => {
        this._isBusy = false;
        const err: ErrorDetails = this._errorsManager.getError(error);
        let buttons: AreaBlockerMessageButton[] = [];
        if ( err.forceLogout ) {
          buttons = [{
            label: this._translate.instant('app.common.ok'),
            action: () => {
              this._blockerMessage = null;
              this._authService.logout();
            }
          }];
        } else {
          buttons = [{
            label: this._translate.instant('app.common.close'),
            action: () => {
              this._blockerMessage = null;
            }
          },
          {
            label: this._translate.instant('app.common.retry'),
            action: () => {
              this.loadReport();
            }
          }];
        }
        this._blockerMessage = new AreaBlockerMessage({
          title: err.title,
          message: err.message,
          buttons
        });
      });
  }

}
