import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {SelectItem, SelectItemGroup} from 'primeng/api';
import {getPrimaryColor} from 'shared/utils/colors';
import {PopupWidgetComponent} from "@kaltura-ng/kaltura-ui";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-metrics-selector-dropdown',
  templateUrl: './metrics-selector-dropdown.component.html',
  styleUrls: ['./metrics-selector-dropdown.component.scss']
})
export class MetricsSelectorDropdownComponent {
  @ViewChild(PopupWidgetComponent) _popup: PopupWidgetComponent;
  @Input() options: SelectItemGroup[] = [];
  @Input() selection: string;
  @Input() colorsMap: { [metric: string]: string } = {};

  @Output() selectionChange = new EventEmitter<string>();
  @Output() change = new EventEmitter<string>();
  public _popupOpened = false;

  public _defaultColor = '#fff';

  public noneOption = {
    label: this._translate.instant(`app.entryLive.discovery.none`),
    value: 'none'
  };

  constructor(private _translate: TranslateService) {
  }

  public getSelectedLabel() {
    let option: string;
    this.options.forEach(optionGroup => {
      const foundOption = optionGroup.items.find(item => item.value === this.selection);
      if (foundOption) {
        option = foundOption.label;
      }
    });
    return option || this.noneOption.label;
  }

  public _onChange(): void {
    this.selectionChange.emit(this.selection);
    this.change.emit(this.selection);
  }

  _onPopupOpen() {
    this._popupOpened = true;
  }

  _onPopupClose() {
    this._popupOpened = false;
  }

  selectMetric(metric: string) {
    this.selection = metric;
    this._onChange();
    if (this._popup) {
      this._popup.close();
    }
  }
}
