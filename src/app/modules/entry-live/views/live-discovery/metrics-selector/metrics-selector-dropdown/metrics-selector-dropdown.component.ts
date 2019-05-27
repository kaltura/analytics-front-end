import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { getPrimaryColor } from 'shared/utils/colors';

@Component({
  selector: 'app-metrics-selector-dropdown',
  templateUrl: './metrics-selector-dropdown.component.html',
  styleUrls: ['./metrics-selector-dropdown.component.scss']
})
export class MetricsSelectorDropdownComponent {
  @Input() options: SelectItem[] = [];
  @Input() selection: string;
  @Input() colorsMap: { [metric: string]: string } = {};
  
  @Output() selectionChange = new EventEmitter<string>();
  @Output() change = new EventEmitter<string>();
  
  public _defaultColor = getPrimaryColor();
  
  public _onChange(): void {
    this.selectionChange.emit(this.selection);
    this.change.emit(this.selection);
  }
}
