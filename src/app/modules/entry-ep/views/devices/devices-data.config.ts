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
            nonComparable: true,
          },
          'unique_combined_live_viewers': {
            format: value => ReportHelper.numberOrNA(value),
            sortOrder: 1
          },
          'unique_vod_viewers': {
            format: value => ReportHelper.numberOrNA(value),
            sortOrder: 2
          }
        }
      },
      [ReportDataSection.totals]: {
        units: '',
        preSelected: 'unique_combined_live_viewers',
        fields: {
          'unique_combined_live_viewers': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.entryWebcast.geo.count_plays`),
            sortOrder: 0
          },
          'unique_vod_viewers': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.entryWebcast.geo.unique_viewers`),
            sortOrder: 1
          }
        }
      }
    };
  }

}
