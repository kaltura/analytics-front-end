import { Component, OnInit } from '@angular/core';
import { TableRow } from 'shared/utils/table-local-sort-handler';
import { KalturaFilterPager } from 'kaltura-ngx-client';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';

@Component({
  selector: 'app-entries-live',
  templateUrl: './entries-live.component.html',
  styleUrls: ['./entries-live.component.scss']
})
export class EntriesLiveComponent implements OnInit {
  public _tableData: TableRow[] = [];
  public _pager = new KalturaFilterPager({ pageIndex: 1, pageSize: 25 });
  public _totalCount = 0;
  public _isBusy = false;
  public _blockerMessage: AreaBlockerMessage;
  public _freeText = '';
  
  ngOnInit(): void {
  
  }
  
  public _drillDown(entry): void {
    console.warn(entry);
  }
  
  public _onPaginationChanged(event): void {
    console.warn(event);
  }
  
  public _onSearch(): void {
    console.warn(this._freeText);
  }
}
