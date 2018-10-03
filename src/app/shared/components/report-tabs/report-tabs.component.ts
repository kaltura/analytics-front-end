import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

export type Tab = {
  title: string;
  value: string;
  selected: boolean;
  units: string;
  key: string;
};

@Component({
  selector: 'app-report-tabs',
  templateUrl: './report-tabs.component.html',
  styleUrls: ['./report-tabs.component.scss']
})
export class ReportTabsComponent implements OnInit {

  @Output() tabChange: EventEmitter<Tab> = new EventEmitter();

  @Input() Tabs: Tab[] = [];
  @Input() CompareMode = false;

  constructor() {
  }

  ngOnInit() {
  }

  public tabClick(tab: Tab): void {
    this.Tabs.forEach((t: Tab) => {
      t.selected = false;
    });
    tab.selected = true;
    this.tabChange.emit(tab);
  }


}
