import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TableModes } from 'shared/pipes/table-mode-icon.pipe';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-table-selector',
  templateUrl: './table-selector.component.html',
  styleUrls: ['./table-selector.component.scss']
})
export class TableSelectorComponent {
  @Input() tableMode: TableModes;
  @Output() tableModeChange = new EventEmitter<TableModes>();
  
  public _tableModes: SelectItem[] = [
    { label: this._translate.instant('app.entryLive.discovery.users'), value: TableModes.users },
    { label: this._translate.instant('app.entryLive.discovery.devices'), value: TableModes.devices },
  ];
  
  constructor(private _translate: TranslateService) {
  }
}
