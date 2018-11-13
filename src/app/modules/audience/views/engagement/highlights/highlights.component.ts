import { Component, OnInit } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';

@Component({
  selector: 'app-engagement-highlights',
  templateUrl: './highlights.component.html',
  styleUrls: ['./highlights.component.scss']
})
export class EngagementHighlightsComponent extends EngagementBaseReportComponent implements OnInit {
  ngOnInit() {
  }
  
  protected _loadReport(): void {
    console.log('EngagementHighlightsComponent - loadReport');
  }

}
