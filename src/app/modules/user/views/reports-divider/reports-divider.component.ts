import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-reports-divider',
  templateUrl: './reports-divider.component.html',
  styleUrls: ['./reports-divider.component.scss']
})
export class ReportsDividerComponent {
  @Input() title: string;
}
