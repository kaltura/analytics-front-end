import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { getPrimaryColor } from 'shared/utils/colors';

@Component({
  selector: 'app-compare-metric',
  templateUrl: './compare-metric.component.html',
  styleUrls: ['./compare-metric.component.scss'],
})
export class CompareMetricComponent {
  @Input() colors: { [key: string]: string } = {};

  @Input() set defaultSelection(value: string) {
    setTimeout(() => { // run in the next loop to make sure *_originalOptions* is defined
      this._selected = this._originalOptions.find(item => item.value === value) || null;
    });
  }
  
  @Input() set metric(value: string) {
    setTimeout(() => { // run in the next loop to make sure *_originalOptions* is defined
      this._metric = value;
      this._options = this._originalOptions.filter(item => item.label !== value);
      this._selected = null;
    });
  }
  
  @Input() set options(value: SelectItem[]) {
    if (Array.isArray(value)) {
      this._originalOptions = [
        { label: this._translate.instant('app.common.none'), value: null },
        ...value,
      ];
    }
  }
  
  @Output() compareTo = new EventEmitter<string>();
  
  private _originalOptions: SelectItem[] = [];
  
  public _options: SelectItem[] = [];
  public _metric: string = null;
  public _defaultColor = getPrimaryColor();
  public _selected: SelectItem = null;
  
  constructor(private _translate: TranslateService) {
  }
  
}
