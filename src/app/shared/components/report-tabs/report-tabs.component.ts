import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

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
  postfixLabel?: string;
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
}
