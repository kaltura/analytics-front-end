import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ReportDataConfig, ReportDataSection, ReportDataBaseConfig} from 'shared/services/storage-data-base.config';
import {ReportHelper} from 'shared/services';
import {EChartOption} from 'echarts';

@Injectable()
export class DevicesDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'device': {
            format: value => value,
          },
          'vod_plays_count': {
            format: value => value
          },
          'live_plays_count': {
            format: value => value
          },
          'sum_view_period': {
            format: value => value
          },
          'sum_live_view_period': {
            format: value => value
          },
          'live_engaged_users_play_time_ratio': {
            format: value => value
          },
          'avg_vod_completion_rate': {
            format: value => value
          }
        }
      },
      [ReportDataSection.totals]: {
        units: '',
        preSelected: 'vod_plays_count',
        fields: {
          'vod_plays_count': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.entryWebcast.devices.count_plays`),
          },
          'live_plays_count': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.entryWebcast.devices.count_plays`),
          },
          'sum_view_period': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.entryWebcast.devices.sum_view_period`)
          },
          'sum_live_view_period': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.entryWebcast.devices.sum_view_period`)
          },
          'live_engaged_users_play_time_ratio': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.entryWebcast.devices.live_engaged_users_play_time_ratio`)
          },
          'avg_vod_completion_rate': {
            format: value => ReportHelper.percents(value / 100, true, true),
            title: this._translate.instant(`app.entryWebcast.devices.avg_vod_completion_rate`)
          }
        }
      }
    };
  }

}
