import { Component, Input } from '@angular/core';
import { KalturaLogger } from '@kaltura-ng/kaltura-logger';
import { FilterComponent } from 'shared/components/filter/filter.component';

@Component({
  selector: 'app-context-table-filter',
  templateUrl: './context-table-filter.component.html',
  styleUrls: ['./context-table-filter.component.scss'],
  providers: [KalturaLogger.createLogger('ContextTableFilterComponent')],
})
export class ContextTableFilterComponent extends FilterComponent {
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
