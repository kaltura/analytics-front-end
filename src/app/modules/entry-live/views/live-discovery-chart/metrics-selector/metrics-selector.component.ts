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

    this._secondaryMetricsOptions = this._getOptionGroups(this._selectedMain);
    this._selectedSecondary = initial ? this._secondaryMetricsOptions[0].items[0].value : this._selectedSecondary;

    this._mainMetricsOptions = this._getOptionGroups(this._selectedSecondary);
  }

  private _getOptionGroups(selectedOption: string) {
    return [{
      label: this._translate.instant('app.entryWebcast.engagement.title'),
      items: this._getOptions(this._metrics.filter(metric => metric !== selectedOption), 'engagement')
    }, {
      label: this._translate.instant('app.entryWebcast.quality.title'),
      items: this._getOptions(this._metrics.filter(metric => metric !== selectedOption), 'qualityOfService')
    }];
  }

  private _getOptions(metrics: string[], group: string) {
    return metrics.filter(metric => this.fields[metric].group === group).map(metric => ({
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
