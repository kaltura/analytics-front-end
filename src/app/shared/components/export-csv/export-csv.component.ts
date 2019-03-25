import { Component, Input, OnDestroy } from '@angular/core';
import { BrowserService, ReportService } from 'shared/services';

@Component({
  selector: 'app-export-csv',
  templateUrl: './export-csv.component.html',
  styleUrls: ['./export-csv.component.scss'],
})
export class ExportCsvComponent implements OnDestroy {
  @Input() name = 'default';

  public _opened = false;
  
  constructor(private _reportService: ReportService,
              private _browserService: BrowserService) {
  }
  
  ngOnDestroy(): void {
  }
}
