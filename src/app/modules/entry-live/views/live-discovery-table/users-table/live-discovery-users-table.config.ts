import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GraphType, ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class LiveDiscoveryUsersTableConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }
  
  private _getFlavor(value: string): string {
    const flavorsValueSeparator = ' / ';
    const topFlavors = value
      .split(flavorsValueSeparator)
      .map(flavor => {
        const [name, count] = flavor.split(':');
        return {
          name: name.replace(/"/g, ''),
          count: Number(count),
        };
      })
      .sort((a, b) => a.count - b.count);
    return topFlavors.length ? topFlavors[0].name : 'N/A';
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'user_id': {
            format: value => value,
            hidden: true,
          },
          'creator_name': {
            format: value => value,
            sortOrder: 1,
          },
          'status': {
            format: value => value,
            sortOrder: 2,
          },
          'avg_view_buffering': {
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
            format: value => ReportHelper.percents(value, false),
            sortOrder: 6,
          },
        }
      },
      [ReportDataSection.totals]: {
        fields: {
          'avg_view_buffering': {
            format: value => `${ReportHelper.percents(value, false)} Buffering Users`,
            sortOrder: 1,
          },
          'sum_view_time': {
            format: value => `${ReportHelper.numberOrZero(value / 60)} Min`,
            sortOrder: 2,
          },
          'known_flavor_params_view_count': {
            format: value => this._getFlavor(value),
            sortOrder: 3,
          },
          'avg_view_engagement': {
            format: value => ReportHelper.percents(value, false),
            sortOrder: 4,
          },
        }
      }
    };
  }
}
