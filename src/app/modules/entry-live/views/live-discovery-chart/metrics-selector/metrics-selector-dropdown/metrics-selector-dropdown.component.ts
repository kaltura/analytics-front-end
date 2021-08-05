import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {SelectItem} from 'primeng/api';
import {getPrimaryColor} from 'shared/utils/colors';
import {PopupWidgetComponent} from "@kaltura-ng/kaltura-ui";

@Component({
  selector: 'app-metrics-selector-dropdown',
  templateUrl: './metrics-selector-dropdown.component.html',
  styleUrls: ['./metrics-selector-dropdown.component.scss']
})
export class MetricsSelectorDropdownComponent {
  @ViewChild('popupWidgetComponent') _popup: PopupWidgetComponent;
  @Input() options: SelectItem[] = [];
  @Input() selection: string;
  @Input() colorsMap: { [metric: string]: string } = {};

  @Output() selectionChange = new EventEmitter<string>();
  @Output() change = new EventEmitter<string>();
  public _popupOpened = false;

  public _defaultColor = getPrimaryColor();

  public _onChange(): void {
    this.selectionChange.emit(this.selection);
    this.change.emit(this.selection);
  }

  public toggleDropdown() {
    if (this._popup) {
      this._popup.toggle();
    }
  }

  _onPopupOpen() {
    this._popupOpened = true;
  }

  _onPopupClose() {
    this._popupOpened = false;
  }
}
