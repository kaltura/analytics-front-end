import { Component, OnInit } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';

@Component({
  selector: 'app-engagement-impressions',
  templateUrl: './impressions.component.html',
  styleUrls: ['./impressions.component.scss']
})
export class EngagementImpressionsComponent extends EngagementBaseReportComponent implements OnInit {
  ngOnInit() {
  }
  
  protected _loadReport(): void {
    console.log('EngagementImpressionsComponent - loadReport');
  }

}
