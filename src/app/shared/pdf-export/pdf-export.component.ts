import {Component, EventEmitter, Input, Output} from '@angular/core';
import * as html2pdf from "html2pdf.js";
import {AppAnalytics, ButtonType} from "shared/services";

@Component({
    selector: 'app-pdf-export',
    templateUrl: './pdf-export.component.html',
	styleUrls: ['./pdf-export.component.scss']
})
export class PdfExportComponent {

	@Input()
  elementToExport: HTMLElement;

	@Input()
  disabled = false;

	@Input()
  filename: string;

	@Input()
  eventName = '';

	@Input()
  feature: string = null;

	@Output()
	exporting = new EventEmitter<boolean>();

	@Output()
	preExport = new EventEmitter();

	@Output()
	postExport = new EventEmitter();

  public _showExportingLoader = false;
  public _exporting = false;
  public _fadeAnimation = false;

	constructor(private _analytics: AppAnalytics) {}

  public downloadReport(el: any): void {
    if (this.disabled) {
      return;
    }
    this._analytics.trackButtonClickEvent(ButtonType.Download, this.eventName.length ? this.eventName : 'Download_PDF_report', null, this.feature);
    this._showExportingLoader = true;
    this._fadeAnimation = true;
    setTimeout(() => {
      this.exporting.emit(true);
      this.preExport.emit();
      this._exporting = true;
      this.elementToExport.setAttribute('id', 'reportToExport');
      this.elementToExport.style.width = 1600 + 'px';
      const originalHeight = this.elementToExport.offsetHeight;
      this.elementToExport.style.height = '2262px';
      // use a timeout to refresh the page binding
      setTimeout(() => {
        let opt = {
          margin:       0,
          enableLinks:  true,
          pagebreak:    { before: '.breakBefore', after: '.breakAfter'},
          filename:     this.filename ? this.filename : 'Summary.pdf',
          image:        { type: 'jpg', quality: 0.90 },
          html2canvas:  { width: this.elementToExport.clientWidth, useCORS: false, dpi: 150, scale: 1 },
          jsPDF:        { units: 'px', orientation: 'portrait' }
        };
        html2pdf(this.elementToExport, opt);
        setTimeout(() => {
          this.elementToExport.removeAttribute('id');
          this.elementToExport.style.width = '100%';
          this.elementToExport.style.height = originalHeight + 'px';
          this.postExport.emit();
          setTimeout(() => {
            this.exporting.emit(false);
            this._exporting = false;
            this._fadeAnimation = false;
            setTimeout(() => {
              this._showExportingLoader = false;
            }, 500);
          }, 500);

        }, 0);
      }, 1000);
    }, 500);
  }
}

