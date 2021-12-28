import { Component, EventEmitter, Input, Output } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { FilterComponent } from 'shared/components/filter/filter.component';

@Component({
  selector: 'app-discovery-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss'],
  providers: [KalturaLogger.createLogger('DiscoveryFilterComponent')],
})
export class DiscoveryFilterComponent extends FilterComponent {
  @Input() totalCount = 0;
  @Input() rangeLabel: string;
  @Input() showUserFilter: boolean;

  @Output() openTimeSelector = new EventEmitter<void>();

  public _onItemSelected(item: any, type: string): void {
    super._onItemSelected(item, type);
    this._apply();
  }

  public _apply(forceApply = false): void {
    super._apply(forceApply);
    this._bottomPadding = '0';
  }
}
