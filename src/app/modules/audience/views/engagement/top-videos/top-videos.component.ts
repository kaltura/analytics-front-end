import { Component, OnInit } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';

@Component({
  selector: 'app-engagement-top-videos',
  templateUrl: './top-videos.component.html',
  styleUrls: ['./top-videos.component.scss']
})
export class EngagementTopVideosComponent extends EngagementBaseReportComponent implements OnInit {
  ngOnInit() {
  }
  
  protected _loadReport(): void {
    console.log('EngagementTopVideosComponent - loadReport');
  }

}
