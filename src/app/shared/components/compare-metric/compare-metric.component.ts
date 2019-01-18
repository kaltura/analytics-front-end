import { Component, Input } from '@angular/core';
import { SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-compare-metric',
  templateUrl: './compare-metric.component.html',
  styleUrls: ['./compare-metric.component.scss'],
})
export class CompareMetricComponent {
  @Input() selectedOption: SelectItem = null;

  @Input() set metric(value: string) {
    setTimeout(() => {
      this._metric = value;
      this._options = this._originalOptions.filter(item => item.label !== value);
      this.selectedOption = null;
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
  
  private _originalOptions: SelectItem[] = [];
  
  public _options: SelectItem[] = [];
  public _metric: string = null;
  
  constructor(private _translate: TranslateService) {
  }
  
}
