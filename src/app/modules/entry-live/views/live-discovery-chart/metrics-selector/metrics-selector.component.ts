import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { SelectItem, SelectItemGroup } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataFields } from 'shared/services/storage-data-base.config';

export interface MetricsSelectorChangeEvent {
  selected: string[];
  initialRun: boolean;
}

@Component({
  selector: 'app-live-discovery-metrics-selector',
  templateUrl: './metrics-selector.component.html',
  styleUrls: ['./metrics-selector.component.scss']
})
export class MetricsSelectorComponent implements OnChanges {
  @Input() fields: ReportDataFields;
  @Input() colorsMap: { [metric: string]: string } = {};

  @Output() selectorChange = new EventEmitter<MetricsSelectorChangeEvent>();

  private _metrics: string[] = [];

  public _mainMetricsOptions: SelectItemGroup[] = [];
  public _secondaryMetricsOptions: SelectItemGroup[] = [];
  public _selectedMain: string;
  public _selectedSecondary: string;

  constructor(private _translate: TranslateService) {
  }

  ngOnChanges() {
    if (this.fields) {
      this._metrics = Object.keys(this.fields);
      this._onChange(true);
    }
  }

  private _updateOptions(initial: boolean): void {
    this._selectedMain = initial ? this._metrics[0] : this._selectedMain;

    this._secondaryMetricsOptions = [{
      label: 'Engagement',
      items: this._getOptions(this._metrics.filter(metric => metric !== this._selectedMain))
    }];
    this._selectedSecondary = initial ? this._secondaryMetricsOptions[0].value : this._selectedSecondary;

    this._mainMetricsOptions = [{
      label: 'Engagement',
      items: this._getOptions(this._metrics.filter(metric => metric !== this._selectedSecondary))
    }, {
      label: 'QOS',
      items: this._getOptions(this._metrics.filter(metric => metric !== this._selectedSecondary))
    }];
    this._mainMetricsOptions.unshift(...this._getOptions(['none']));
    this._secondaryMetricsOptions.unshift(...this._getOptions(['none']));
  }

  private _getOptions(metrics: string[]) {
    return metrics.map(metric => ({
      label: this._translate.instant(`app.entryLive.discovery.${metric}`),
      value: metric,
      items: []
    }));
  }

  public _onChange(initial = false): void {
    this._updateOptions(initial);

    this.selectorChange.emit({
      selected: [this._selectedMain, this._selectedSecondary],
      initialRun: initial,
    });
  }
}
