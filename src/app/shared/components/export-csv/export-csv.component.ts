import { Component, OnInit, Input } from '@angular/core';
import { KalturaFilterPager, KalturaReportInputFilter, KalturaReportType, ReportGetUrlForReportAsCsvActionArgs } from 'kaltura-ngx-client';
import { BrowserService, ErrorDetails, ErrorsManagerService, ReportService } from 'shared/services';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';

@Component({
  selector: 'app-export-csv',
  templateUrl: './export-csv.component.html',
  styleUrls: ['./export-csv.component.scss']
})
export class ExportCsvComponent implements OnInit {

  @Input() headers: string;
  @Input() dimension: string;
  @Input() totalCount: number;
  @Input() reportType: KalturaReportType;
  @Input() reportInputFilter: KalturaReportInputFilter;
  @Input() reportText: string;
  @Input() reportTitle: string;

  public _exportingCsv: boolean;
  public _downloading = false;
  public _status = '';
  public _errorDetails = '';

  private downloadLink = '';

  constructor(private _errorsManager: ErrorsManagerService,
              private _logger: KalturaLogger,
              private _reportService: ReportService,
              private _browserService: BrowserService) {
  }

  ngOnInit() {
  }

  public exportToScv(): void {
    this._exportingCsv = true;
    this._status = this.downloadLink = '';
    const args: ReportGetUrlForReportAsCsvActionArgs = {
      dimension: this.dimension,
      pager: new KalturaFilterPager({pageSize: this.totalCount, pageIndex: 1}),
      reportType: this.reportType,
      reportInputFilter: this.reportInputFilter,
      headers: this.headers,
      reportText: this.reportText,
      reportTitle: this.reportTitle
    };
    this._reportService.exportToCsv(args).subscribe(
      result => {
        this._exportingCsv = false;
        this._status = 'ready';
        this.downloadLink = result;
      },
      error => {
        this._exportingCsv = false;
        this.downloadLink = '';
        const err: ErrorDetails = this._errorsManager.getError(error);
        this._status = 'error';
        this._errorDetails = err.message;
        this._logger.error(`Error exporting to CSV: ${err.message}`);
      }
    );
  }

  public download(): void {
    this._downloading = true;
    this._browserService.download(this.downloadLink, this.reportTitle + '.csv', 'text/csv');
    setTimeout(() => {
      this._status = '';
      this._downloading = false;
    }, 1500);
  }

}
