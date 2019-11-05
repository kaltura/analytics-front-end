import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class LiveDiscoveryDevicesTableConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  private _getFlavor(value: string): string {
    const flavorsValueSeparator = /"[^"]+":\d+\/?/gi;
    const topFlavors = value
      .match(flavorsValueSeparator)
      .map(flavor => {
        const [name, count] = flavor.split(':');
        return {
          name: name.replace(/"/g, ''),
          count: parseFloat(count),
        };
      })
      .sort((a, b) => b.count - a.count);
    return topFlavors.length ? topFlavors[0].name : 'N/A';
  }

  public getConfig(showUsersColumn = true): ReportDataConfig {
    const config = {
      [ReportDataSection.table]: {
        fields: {
          'device': {
            format: value => value,
            sortOrder: 1,
          },
          'view_unique_audience': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'view_buffer_time_ratio': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 3,
          },
          'sum_view_time': {
            format: value => `${ReportHelper.numberOrZero(value / 60)} Min`,
            sortOrder: 4,
          },
          'known_flavor_params_view_count': {
            format: value => this._getFlavor(value),
            sortOrder: 5,
          },
          'avg_view_engagement': {
            format: value => ReportHelper.percents(value),
            sortOrder: 6,
          },
        }
      },
      [ReportDataSection.totals]: {
        fields: {
          'view_unique_audience': {
            format: value => ReportHelper.numberOrZero(value),
            sortOrder: 2,
          },
          'view_buffer_time_ratio': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 4,
          },
          'sum_view_time': {
            format: value => `${ReportHelper.numberOrZero(value / 60)} Min`,
            sortOrder: 5,
          },
          'known_flavor_params_view_count': {
            format: value => this._getFlavor(value),
            sortOrder: 6,
          },
          'avg_view_engagement': {
            format: value => ReportHelper.percents(value),
            sortOrder: 3,
          },
        }
      }
    };
    
    if (!showUsersColumn) {
      delete config[ReportDataSection.table].fields.view_unique_audience;
      delete config[ReportDataSection.totals].fields.view_unique_audience;
    }
  
    return config;
  }
}
