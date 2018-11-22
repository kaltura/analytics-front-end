import { Component, OnInit } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { KalturaFilterPager } from 'kaltura-ngx-client';

@Component({
  selector: 'app-engagement-top-videos',
  templateUrl: './top-videos.component.html',
  styleUrls: ['./top-videos.component.scss']
})
export class EngagementTopVideosComponent extends EngagementBaseReportComponent implements OnInit {
  private _order = '-bandwidth_consumption';
  
  public _blockerMessage: AreaBlockerMessage = null;
  public _isBusy: boolean;
  public _tableData: any[] = [];
  public _isCompareMode: boolean;
  public _columns: string[] = [];
  public _pager = new KalturaFilterPager({ pageSize: 100, pageIndex: 1 });
  public _totalCount = 0;
  public _firstTimeLoading = true;
  
  ngOnInit() {
  }
  
  protected _loadReport(): void {
    console.log('EngagementTopVideosComponent - loadReport');
  }
  
  protected _updateFilter(): void {
    console.log('EngagementTopVideosComponent - updateFilter');
  }
  
  public _onSortChanged(event): void {
    if (event.data.length && event.field && event.order && !this._isCompareMode) {
      const order = event.order === 1 ? '+' + event.field : '-' + event.field;
      if (order !== this._order) {
        this._order = order;
        this._loadReport();
      }
    }
  }
  
  public _onPaginationChanged(event): void {
    if (event.page !== (this._pager.pageIndex - 1)) {
      this._pager.pageIndex = event.page + 1;
      this._loadReport();
    }
  }
}
