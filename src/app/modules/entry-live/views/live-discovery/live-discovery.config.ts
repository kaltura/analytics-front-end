import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GraphType, ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class LiveDiscoveryConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'avg_view_dropped_frames_ratio': {
            format: value => ReportHelper.percents(value / 100, false),
            colors: ['#9b64e6'],
            graphType: GraphType.line,
            sortOrder: 1,
          },
          'view_unique_buffering_users': {
            format: value => ReportHelper.percents(value / 100, false),
            colors: ['#e1962e'],
            graphType: GraphType.line,
            sortOrder: 2,
          },
          'avg_view_bitrate': {
            format: value => ReportHelper.numberOrZero(value) + 'Kbps',
            colors: ['#f7c25c'],
            graphType: GraphType.line,
            sortOrder: 3,
          },
          'avg_view_latency': {
            format: value => ReportHelper.percents(value / 100, false),
            colors: ['#f3737b'],
            graphType: GraphType.line,
            sortOrder: 4,
          },
          'avg_view_downstream_bandwidth': {
            format: value => ReportHelper.numberOrZero(value) + 'sec',
            colors: ['#e0313a'],
            graphType: GraphType.line,
            sortOrder: 5,
          },
          'sum_view_time': {
            format: value => ReportHelper.numberOrZero(value) + 'sec',
            colors: ['#487adf'], // replace with relevant color
            graphType: GraphType.line,
            sortOrder: 6,
          },
          'view_unique_audience': {
            format: value => ReportHelper.numberOrZero(value),
            colors: ['#31bea6'],
            graphType: GraphType.line,
            sortOrder: 7,
          },
          'view_unique_audience_dvr': {
            format: value => ReportHelper.numberOrZero(value),
            colors: ['#60e4cc'],
            graphType: GraphType.line,
            sortOrder: 8,
          },
          'view_unique_engaged_users': {
            format: value => ReportHelper.numberOrZero(value),
            colors: ['#1b8271'],
            graphType: GraphType.line,
            sortOrder: 9,
          },
        }
      },
    };
  }
}
