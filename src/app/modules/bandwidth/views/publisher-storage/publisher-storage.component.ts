import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { DateChangeEvent, DateRangeType } from 'shared/components/date-filter/date-filter.service';
import { KalturaReportInputFilter, KalturaReportType } from 'kaltura-ngx-client';

@Component({
  selector: 'app-publisher-storage',
  templateUrl: './publisher-storage.component.html',
  styleUrls: ['./publisher-storage.component.scss']
})
export class PublisherStorageComponent implements OnInit {

  public _dateRangeType: DateRangeType = DateRangeType.LongTerm;
  public _metrics: SelectItem[] = [];
  public _selectedMetrics = 'bandwidth_consumption';

  private filter: KalturaReportInputFilter = new KalturaReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );
  private reportType = KalturaReportType.partnerUsage;

  constructor(private _translate: TranslateService) { }

  ngOnInit() {
    const metrics: string[] = ['bandwidth_consumption', 'average_storage', 'peak_storage', 'added_storage', 'deleted_storage', 'combined_bandwidth_storage', 'transcoding_consumption'];
    metrics.forEach( key => {
      this._metrics.push({label: this._translate.instant(key), value: key});
    });
  }

  public onDateFilterChange(event: DateChangeEvent): void {
    this.filter.timeZoneOffset = event.timeZoneOffset;
    this.filter.fromDate = event.startDate;
    this.filter.toDate = event.endDate;
    this.filter.interval = event.timeUnits;
    debugger;
  }

  public onMetricsChange(event): void {
    debugger;
  }

}
