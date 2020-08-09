import {Component, ElementRef} from '@angular/core';
import { DateChangeEvent, DateRanges } from 'shared/components/date-filter/date-filter.service';
import { KalturaEndUserReportInputFilter, KalturaReportInterval, KalturaReportType } from 'kaltura-ngx-client';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { RefineFilter } from 'shared/components/filter/filter.component';
import { EngagementExportConfig } from './engagement-export.config';
import { ExportItem } from 'shared/components/export-csv/export-config-base.service';
import { reportTypeMap } from 'shared/utils/report-type-map';
import { analyticsConfig } from 'configuration/analytics-config';

@Component({
  selector: 'app-engagement',
  templateUrl: './engagement.component.html',
  styleUrls: ['./engagement.component.scss'],
  providers: [
    EngagementExportConfig,
    KalturaLogger.createLogger('EngagementComponent')
  ]
})
export class EngagementComponent {
  public _selectedRefineFilters: RefineFilter = null;
  public _dateRange = DateRanges.Last30D;
  public _timeUnit = KalturaReportInterval.days;
  public _totalCount: number;
  public _reportType: KalturaReportType = reportTypeMap(KalturaReportType.userUsage);
  public _selectedMetrics: string;
  public _dateFilter: DateChangeEvent = null;
  public _refineFilter: RefineFilter = null;
  public _refineFilterOpened = false;
  public _exportConfig: ExportItem[] = [];
  public _engagementViewConfig = analyticsConfig.viewsConfig.audience.engagement;
  public _miniViewsCount = [
    this._engagementViewConfig.miniHighlights,
    this._engagementViewConfig.miniTopVideos,
    this._engagementViewConfig.miniPeakDay,
  ].filter(Boolean).length;
  public _filter: KalturaEndUserReportInputFilter = new KalturaEndUserReportInputFilter(
    {
      searchInTags: true,
      searchInAdminTags: false
    }
  );

  constructor(private _exportConfigService: EngagementExportConfig) {
    this._exportConfig = _exportConfigService.getConfig();
  }


  public _onDateFilterChange(event: DateChangeEvent): void {
    this._dateFilter = event;
  }

  public _onRefineFilterChange(event: RefineFilter): void {
    this._refineFilter = event;
  }

  public _onDrillDown(event: string): void {
    let update: Partial<ExportItem> = {};
    if (event) {
      update.objectIds = event;
    }

    this._exportConfig = EngagementExportConfig.updateConfig(this._exportConfigService.getConfig(), 'syndication', update);
  }

  public exportPDF(el: any): void{
    el.style.display = 'none';
    var element = document.getElementById('reportToExport');
    element.style.paddingLeft = 20 + 'px';
    element.style.backgroundColor = '#f2f2f2';
    let scrollHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );
    var opt = {
      margin:       0,
      filename:     'myfile.pdf',
      image:        { type: 'jpeg', quality: 0.95 },
      html2canvas:  { width: document.getElementsByClassName('kContent')[0].clientWidth + 40, height: scrollHeight + window.innerHeight -50, useCORS: true, backgroundColor: '#f2f2f2' },
      jsPDF:        { units: 'px', orientation: 'portrait' }
    };
    window['html2pdf'](element, opt);
    setTimeout(() =>{
      element.style.paddingLeft = null;
      element.style.backgroundColor = null;
      el.style.display = 'block';
    },0);


  }
}
