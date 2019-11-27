import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class EntryTotalsConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'count_loads': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entry.count_loads`),
            sortOrder: 1,
            icon: 'icon-small-impressions',
            iconColor: 'aqua',
          },
          'count_plays': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.entry.count_plays`),
            sortOrder: 2,
            icon: 'icon-small-play',
            iconColor: 'blue',
          },
          'unique_known_users': {
            format: value => ReportHelper.integerOrZero(value),
            title: this._translate.instant(`app.entry.viewers`),
            tooltip: this._translate.instant('app.entry.viewers_tt'),
            sortOrder: 3,
            icon: 'icon-small-viewer-contributor',
            iconColor: 'green',
          },
          'sum_time_viewed': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.entry.minutes`),
            units: value => 'min',
            sortOrder: 4,
            icon: 'icon-small-time',
            iconColor: 'orange',
          },
          'avg_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            title: this._translate.instant(`app.entry.watched`),
            tooltip: this._translate.instant('app.entry.watched_tt'),
            sortOrder: 5,
            icon: 'icon-small-Completion-Rate',
            iconColor: 'green',
          },
          'count_viral': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.entry.count_viral`),
            hidden: true,
          },
          'votes': {
            format: value => ReportHelper.numberOrZero(value),
            title: this._translate.instant(`app.entry.votes`),
            hidden: true,
          },
        }
      }
    };
  }
}
