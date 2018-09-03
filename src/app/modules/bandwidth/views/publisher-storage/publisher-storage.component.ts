import { Component, OnInit, OnDestroy } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { ErrorsManagerService } from 'shared/services';
import { KalturaClient, KalturaReportInputFilter, KalturaReportType, ReportGetTotalAction } from 'kaltura-ngx-client';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './publisher-storage.component.html',
  styleUrls: ['./publisher-storage.component.scss']
})
export class PublisherStorageComponent implements OnInit, OnDestroy {

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _metrics: SelectItem[] = [];
  public _selectedMetrics = 'bandwidth_consumption';

  private filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  constructor(private _translate: TranslateService, private _kalturaClient: KalturaClient, private _errorsManager: ErrorsManagerService ) { }

  ngOnInit() {
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
    const getTotal = new ReportGetTotalAction({
      reportType: KalturaReportType.partnerUsage,
      reportInputFilter: this.filter
    });

    this._kalturaClient.request(getTotal).pipe(cancelOnDestroy(this))
      .subscribe(response => {
        // debugger;
      },
      error => {
        this._errorsManager.handleError(error);
      });
  }

}
