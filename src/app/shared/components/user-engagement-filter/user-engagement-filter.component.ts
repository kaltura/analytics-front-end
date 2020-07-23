import { Component, Input } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { FilterComponent } from 'shared/components/filter/filter.component';

@Component({
  selector: 'app-user-engagement-filter',
  templateUrl: './user-engagement-filter.component.html',
  styleUrls: ['./user-engagement-filter.component.scss'],
  providers: [KalturaLogger.createLogger('UserEngagementFilterComponent')],
})
export class UserEngagementFilterComponent extends FilterComponent {
  public _totalCount = 0;

  @Input() showUserFilter = true;

  @Input() set totalCount(val) {
    if (val !== undefined) {
      this._totalCount = val;
    } else {
      this._totalCount = 0;
    }
  }

  public _onItemSelected(item: any, type: string): void {
    super._onItemSelected(item, type);
    this._apply();
  }

  public _apply(forceApply = false): void {
    super._apply(forceApply);
    this._bottomPadding = '0';
  }
}
