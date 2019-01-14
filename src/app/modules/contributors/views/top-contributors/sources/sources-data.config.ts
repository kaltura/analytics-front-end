import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { getPrimaryColor, getSecondaryColor } from 'shared/utils/colors';
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
            format: value => value,
            sortOrder: 2,
          },
          'unique_contributors': {
            format: value => value,
            sortOrder: 3,
          },
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'added_entries',
        fields: {
          'added_entries': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.contributors.added_entries`),
            tooltip: this._translate.instant(`app.contributors.added_entries_tt`),
            sortOrder: 1,
          },
          'added_msecs': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.contributors.added_msecs`),
            tooltip: this._translate.instant(`app.contributors.added_msecs_tt`),
            units: value => 'min',
            sortOrder: 2,
          },
          'unique_contributors': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.contributors.contributors`),
            tooltip: this._translate.instant(`app.contributors.contributors_tt`),
            sortOrder: 3,
          }
        }
      },
      [ReportDataSection.graph]: {
        fields: {
          'default': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
          }
        }
      }
    };
  }
}
