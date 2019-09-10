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

  @Output() tabChange: EventEmitter<Tab> = new EventEmitter();
  
  @ViewChildren(ElementFocusDirective) _tabs: QueryList<ElementFocusDirective>;
  
  private _tabFocus = 0;

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
    tabs[this._tabFocus].removeFocus();
    
    if (direction === 'right') {
      this._tabFocus++;
      if (this._tabFocus >= tabs.length) {
        this._tabFocus = 0;
      }
    } else {
      this._tabFocus--;
      if (this._tabFocus < 0) {
        this._tabFocus = tabs.length - 1;
      }
    }
    
    tabs[this._tabFocus].setFocus();
  }
}
