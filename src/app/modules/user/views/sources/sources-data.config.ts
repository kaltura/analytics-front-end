import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import {ReportHelper} from "shared/services";

@Injectable()
export class SourcesDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'source': {
            format: value => value,
            sortOrder: 1,
          },
          'added_entries': {
            format: value => value,
            sortOrder: 1,
          },
          'added_msecs': {
            format: value => ReportHelper.minutes(value),
            sortOrder: 2,
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'added_entries',
        fields: {
          'added_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.contributors.added_entries`),
            sortOrder: 1,
          },
          'added_msecs': {
            format: value => ReportHelper.numberOrZero(ReportHelper.minutes(value)),
            title: this._translate.instant(`app.contributors.added_msecs`),
            units: value => 'min',
            sortOrder: 2,
          }
        }
      },
      [ReportDataSection.graph]: {
        fields: {
          'added_entries': {
            format: value => value,
            colors: ['entries'],
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>`,
            nonDateGraphLabel: true,
          },
          'added_msecs': {
            format: value => value,
            colors: ['time'],
            graphTooltip: (value) => `<span class="kValue">${ReportHelper.numberOrZero(String(value), false)}</span>&nbsp;Min`,
            nonDateGraphLabel: true,
          }
        }
      }
    };
  }

}
