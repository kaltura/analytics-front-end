import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { ElementFocusDirective } from 'shared/directives/element-focus.directive';

export type Tab = {
  title: string;
  tooltip: string;
  value: string;
  selected: boolean;
  units: string;
  key: string;
  rawValue: number | string;
  trend?: number;
  sortOrder?: number;
  hidden?: boolean;
  icon?: string;
  iconColor?: string;
};

@Component({
  selector: 'app-report-tabs',
  templateUrl: './report-tabs.component.html',
  styleUrls: ['./report-tabs.component.scss']
})
export class ReportTabsComponent implements OnInit {
  @Input() tabs: Tab[] = [];
  @Input() compareMode = false;
  @Input() showValue = true;
  @Input() narrowTabs = false;

  @Output() tabChange: EventEmitter<Tab> = new EventEmitter();
  
  @ViewChildren(ElementFocusDirective) _tabs: QueryList<ElementFocusDirective>;
  
  constructor() {
  }

  ngOnInit() {
  }

  public tabClick(tab: Tab): void {
    this.tabs.forEach((t: Tab) => {
      t.selected = false;
    });
    tab.selected = true;
    this.tabChange.emit(tab);
  }
  
  public _moveFocus(direction: 'right' | 'left'): void {
    const tabs = this._tabs.toArray();
    let tabFocus = tabs.findIndex(({ isFocused }) => isFocused);
    tabFocus = tabFocus === -1 ? 0 : tabFocus;

    tabs[tabFocus].blur();
    
    if (direction === 'right') {
      tabFocus++;
      if (tabFocus >= tabs.length) {
        tabFocus = 0;
      }
    } else {
      tabFocus--;
      if (tabFocus < 0) {
        tabFocus = tabs.length - 1;
      }
    }
    
    tabs[tabFocus].focus();
  }
}
