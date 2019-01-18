import { Component, Input } from '@angular/core';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'app-compare-metric',
  templateUrl: './compare-metric.component.html',
  styleUrls: ['./compare-metric.component.scss'],
})
export class CompareMetricComponent {
  @Input() metric: string;
  @Input() selectedOption: SelectItem = null;
  @Input() options: SelectItem[] = [];
}
