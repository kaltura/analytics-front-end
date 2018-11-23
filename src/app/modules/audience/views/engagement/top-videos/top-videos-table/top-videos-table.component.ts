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
  @Input() pager: KalturaFilterPager;
  @Input() totalCount = 0;
  
  public _pager = new KalturaFilterPager({ pageSize: 10, pageIndex: 1 });

  public _onSortChanged(event): void {
  
  }
  
  public _onPaginationChanged(event): void {
  
  }
}
