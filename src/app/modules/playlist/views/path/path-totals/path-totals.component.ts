import {Component, Input} from '@angular/core';
import { ReportService } from 'shared/services';
import { PathTotalsConfig } from './path-totals.config';
import { BasePlaylistTotalsComponent, TotalsConfig } from '../../shared/playlist-totals/playlist-totals.component';
import {ViewConfig, viewsConfig} from "configuration/view-config";
import {isEmptyObject} from "shared/utils/is-empty-object";

@Component({
  selector: 'app-path-entry-totals',
  templateUrl: './path-totals.component.html',
  styleUrls: ['./path-totals.component.scss'],
  providers: [ReportService, { provide: TotalsConfig, useClass: PathTotalsConfig }]
})
export class PathEntryTotalsComponent extends BasePlaylistTotalsComponent {
  @Input() set viewConfig(value: ViewConfig) {
    if (!isEmptyObject(value)) {
      this._viewConfig = value;
    } else {
      this._viewConfig = { ...viewsConfig.playlist.totals };
    }
  }
  public _viewConfig: ViewConfig = { ...viewsConfig.playlist.totals };
}
