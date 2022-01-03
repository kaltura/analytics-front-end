import {Component, Input} from '@angular/core';
import { ReportService } from 'shared/services';
import { EntryTotalsConfig } from './entry-totals.config';
import { BaseEntryTotalsComponent, TotalsConfig } from '../../shared/entry-totals/entry-totals.component';
import { ViewConfig, viewsConfig } from "configuration/view-config";
import { isEmptyObject } from "shared/utils/is-empty-object";

@Component({
  selector: 'app-video-entry-totals',
  templateUrl: './entry-totals.component.html',
  styleUrls: ['../../shared/entry-totals/entry-totals.component.scss', './entry-totals.component.scss'],
  providers: [ReportService, { provide: TotalsConfig, useClass: EntryTotalsConfig }]
})
export class VideoEntryTotalsComponent extends BaseEntryTotalsComponent {
  @Input() set viewConfig(value: ViewConfig) {
    if (!isEmptyObject(value)) {
      this._viewConfig = value;
    } else {
      this._viewConfig = { ...viewsConfig.entry.totals };
    }
  }

  public _viewConfig: ViewConfig = { ...viewsConfig.entry.totals };
}
