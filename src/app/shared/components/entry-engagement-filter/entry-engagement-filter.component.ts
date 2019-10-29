import { Component, Input } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { FilterComponent } from 'shared/components/filter/filter.component';

@Component({
  selector: 'app-entry-engagement-filter',
  templateUrl: './entry-engagement-filter.component.html',
  styleUrls: ['./entry-engagement-filter.component.scss'],
  providers: [KalturaLogger.createLogger('EntryEngagementFilterComponent')],
})
export class EntryEngagementFilterComponent extends FilterComponent {
  @Input() totalCount = 0;

  public _onItemSelected(item: any, type: string): void {
    super._onItemSelected(item, type);
    this._apply();
  }
  
  public _apply(forceApply = false): void {
    super._apply(forceApply);
    this._bottomPadding = '0';
  }
}
