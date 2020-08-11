import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class MiniLiveEngagementConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.totals]: {
        fields: {
          'live_no_eng_view_period_play_time_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            title: this._translate.instant(`app.entryWebcast.liveEngagement.none`),
            tooltip: this._translate.instant(`app.entryWebcast.liveEngagement.none_tt`),
            sortOrder: 1,
          },
          'live_low_eng_view_period_play_time_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            title: this._translate.instant(`app.entryWebcast.liveEngagement.low`),
            tooltip: this._translate.instant(`app.entryWebcast.liveEngagement.low_tt`),
            sortOrder: 2,
          },
          'live_fair_eng_view_period_play_time_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            title: this._translate.instant(`app.entryWebcast.liveEngagement.fair`),
            tooltip: this._translate.instant(`app.entryWebcast.liveEngagement.fair_tt`),
            sortOrder: 3,
          },
          'live_good_eng_view_period_play_time_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            title: this._translate.instant(`app.entryWebcast.liveEngagement.good`),
            tooltip: this._translate.instant(`app.entryWebcast.liveEngagement.good_tt`),
            sortOrder: 4,
          },
          'live_high_eng_view_period_play_time_rate': {
            format: value => ReportHelper.percents(value / 100, false, true),
            title: this._translate.instant(`app.entryWebcast.liveEngagement.high`),
            tooltip: this._translate.instant(`app.entryWebcast.liveEngagement.high_tt`),
            sortOrder: 5,
          }
        }
      }
    };
  }
}
