import { Component, OnInit } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';

@Component({
  selector: 'app-engagement-duration',
  templateUrl: './duration.component.html',
  styleUrls: ['./duration.component.scss']
})
export class EngagementDurationComponent extends EngagementBaseReportComponent implements OnInit {
  protected _componentId = 'duration';

  ngOnInit() {
  }
  
  protected _loadReport(): void {
    console.log('EngagementDurationComponent - loadReport');
  }
  
  protected _updateFilter(): void {
    console.log('EngagementDurationComponent - updateFilter');
  }
  
  protected _updateRefineFilter(): void {
  
  }
}
