import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ReportDataConfig, ReportDataSection, ReportDataBaseConfig} from 'shared/services/storage-data-base.config';
import {ReportHelper} from 'shared/services';
import {EChartOption} from 'echarts';

@Injectable()
export class IndustriesDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'industry': {
            format: value => value,
            nonComparable: true,
          },
          'registered': {
            format: value => value
          },

        }
      },
      [ReportDataSection.totals]: {
        units: '',
        preSelected: 'registered',
        fields: {
          'registered': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.ve.registered`),
          }
        }
      }
    };
  }

}