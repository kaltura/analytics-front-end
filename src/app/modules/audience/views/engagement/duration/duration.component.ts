import { Component, OnInit } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';

@Component({
  selector: 'app-engagement-duration',
  templateUrl: './duration.component.html',
  styleUrls: ['./duration.component.scss']
})
export class EngagementDurationComponent extends EngagementBaseReportComponent implements OnInit {
  ngOnInit() {
  }
  
  protected _loadReport(): void {
    console.log('EngagementDurationComponent - loadReport');
  }

}
