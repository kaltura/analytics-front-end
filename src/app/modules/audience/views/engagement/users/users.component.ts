import { Component, OnInit } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';

@Component({
  selector: 'app-engagement-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class EngagementUsersComponent extends EngagementBaseReportComponent implements OnInit {
  ngOnInit() {
  }


  protected _loadReport(): void {
    console.log('EngagementUsersComponent - loadReport');
  }
  
  protected _updateFilter(): void {
    console.log('EngagementUsersComponent - updateFilter');
  }
}
