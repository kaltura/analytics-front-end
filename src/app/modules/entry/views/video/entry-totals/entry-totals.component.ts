import { Component } from '@angular/core';
import { ReportService } from 'shared/services';
import { EntryTotalsConfig } from './entry-totals.config';
import { BaseEntryTotalsComponent, TotalsConfig } from '../../shared/entry-totals/entry-totals.component';

@Component({
  selector: 'app-video-entry-totals',
  templateUrl: './entry-totals.component.html',
  styleUrls: ['../../shared/entry-totals/entry-totals.component.scss', './entry-totals.component.scss'],
  providers: [ReportService, { provide: TotalsConfig, useClass: EntryTotalsConfig }]
})
export class VideoEntryTotalsComponent extends BaseEntryTotalsComponent {

}
