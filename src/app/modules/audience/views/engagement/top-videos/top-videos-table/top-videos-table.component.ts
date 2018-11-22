import { Component, Input } from '@angular/core';
import { KalturaFilterPager } from 'kaltura-ngx-client';

@Component({
  selector: 'app-engagement-top-videos-table',
  templateUrl: './top-videos-table.component.html',
  styleUrls: ['./top-videos-table.component.scss']
})
export class TopVideosTableComponent {
  @Input() tableData = [];
  @Input() isCompareMode: boolean;
  @Input() columns: string[] = [];
  @Input() firstTimeLoading = true;
  
  private _order = '-bandwidth_consumption';
  
  public _columns: string[] = [];
  public _pager = new KalturaFilterPager({ pageSize: 100, pageIndex: 1 });
  public _totalCount = 0;
  
  public _onSortChanged(event): void {
  
  }
  
  public _onPaginationChanged(event): void {
  
  }
}
