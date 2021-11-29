import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { getPrimaryColor } from 'shared/utils/colors';

@Component({
  selector: 'app-overview-metrics-selector-dropdown',
  templateUrl: './overview-metrics-selector-dropdown.component.html',
  styleUrls: ['./overview-metrics-selector-dropdown.component.scss']
})
export class OverviewMetricsSelectorDropdownComponent {
  @Input() options: SelectItem[] = [];
  @Input() selection: string;
  @Input() colorsMap: { [metric: string]: string } = {};

  @Output() selectionChange = new EventEmitter<string>();

  public _defaultColor = getPrimaryColor();

  public _onChange(): void {
    this.selectionChange.emit(this.selection);
  }
}
