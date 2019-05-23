import { Component, Input } from '@angular/core';
import { EChartOption } from 'echarts';

@Component({
  selector: 'app-discovery-chart',
  templateUrl: './discovery-chart.component.html',
  styleUrls: ['./discovery-chart.component.scss']
})
export class DiscoveryChartComponent {
  @Input() isBusy: boolean;
  
  @Input() selectedMetrics: string[];
  
  @Input() set data(value) {
    if (value) {
      this._handleData(value);
    } else {
      this._chartData = null;
    }
  }
  
  private _defaultMetrics = ['avg_view_dropped_frames_ratio', 'view_unique_buffering_users'];
  
  public _chartData: EChartOption;
  
  private _handleData(value): void {
    const metrics = this.selectedMetrics || this._defaultMetrics;
    console.warn(value);
  }
  
  public displayMetrics(metrics: string[]): void {
    this.selectedMetrics = metrics;
  }
}
