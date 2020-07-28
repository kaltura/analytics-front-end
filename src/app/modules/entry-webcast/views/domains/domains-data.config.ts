import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ReportDataConfig, ReportDataSection, ReportDataBaseConfig} from 'shared/services/storage-data-base.config';
import {ReportHelper} from 'shared/services';
import {EChartOption} from 'echarts';

@Injectable()
export class DomainsDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            nonComparable: true,
          },
          'domain_name': {
            format: value => value,
            nonComparable: true,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'unique_viewers': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'sum_view_period': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'avg_live_buffer_time': {
            format: value => ReportHelper.percents(value, false, true)
          },
          'avg_vod_completion_rate': {
            format: value => ReportHelper.percents(value / 100, false, true)
          }
        }
      },
      [ReportDataSection.totals]: {
        units: '',
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.entryWebcast.geo.count_plays`),
          },
          'unique_viewers': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.entryWebcast.geo.unique_viewers`)
          },
          'sum_view_period': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.entryWebcast.geo.sum_view_period`)
          },
          'avg_live_buffer_time': {
            format: value => ReportHelper.percents(value, true, true),
            title: this._translate.instant(`app.entryWebcast.geo.avg_live_buffer_time`)
          },
          'avg_vod_completion_rate': {
            format: value => ReportHelper.percents(value / 100, true, true),
            title: this._translate.instant(`app.entryWebcast.geo.avg_vod_completion_rate`)
          }
        }
      }
    };
  }

}
