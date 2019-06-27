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
          'view_unique_buffering_users': {
            format: value => Math.round(value),
            colors: ['#e1962e'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.view_unique_buffering_users')}: ${ReportHelper.numberOrZero(value)}`,
            sortOrder: 1,
          },
          'view_unique_audience': {
            format: value => Math.round(value),
            colors: ['#31bea6'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.view_unique_audience')}: ${ReportHelper.numberOrZero(value)}`,
            sortOrder: 2,
          },
          'view_unique_audience_dvr': {
            format: value => Math.round(value),
            colors: ['#60e4cc'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.view_unique_audience_dvr')}: ${ReportHelper.numberOrZero(value)}`,
            sortOrder: 3,
          },
          'view_unique_engaged_users': {
            format: value => Math.round(value),
            colors: ['#1b8271'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.view_unique_engaged_users')}: ${ReportHelper.numberOrZero(value)}`,
            sortOrder: 4,
          },
          'avg_view_dropped_frames_ratio': {
            format: value => (value * 100).toFixed(1),
            colors: ['#9b64e6'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_dropped_frames_ratio')}: ${ReportHelper.percents(value / 100, false)}`,
            units: () => '%',
            sortOrder: 5,
          },
          // 'avg_view_bitrate': {
          //   format: value => Number(value).toFixed(1),
          //   colors: ['#f7c25c'],
          //   graphType: GraphType.line,
          //   graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_bitrate')}: ${ReportHelper.numberOrZero(value, false)} KBPS`,
          //   units: () => 'KBPS',
          //   sortOrder: 6,
          // },
          'avg_view_live_latency': {
            format: value => Math.round(value),
            colors: ['#f3737b'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_live_latency')}: ${ReportHelper.numberOrZero(value)} Seconds`,
            units: () => 'Seconds',
            sortOrder: 7,
          },
          'avg_view_downstream_bandwidth': {
            format: value => Math.round(value),
            colors: ['#e0313a'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_downstream_bandwidth')}: ${ReportHelper.numberOrZero(value)} KBPS`,
            units: () => 'KBPS',
            sortOrder: 8,
          },
          'sum_view_time': {
            format: value => Math.round(value),
            colors: ['#487adf'], // replace with relevant color
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.sum_view_time')}: ${ReportHelper.numberOrZero(value)} Seconds`,
            units: () => 'Seconds',
            sortOrder: 9,
          },
        }
      },
      [ReportDataSection.totals]: {
        fields: {
          'avg_view_dropped_frames_ratio': {
            format: value => ReportHelper.percents(value, false),
          },
          'view_unique_buffering_users': {
            format: value => ReportHelper.numberOrZero(value),
          },
          // 'avg_view_bitrate': {
          //   format: value => `${ReportHelper.numberOrZero(value, false)} KBPS`,
          // },
          'avg_view_live_latency': {
            format: value => `${ReportHelper.numberOrZero(value)} Seconds`,
          },
          'avg_view_downstream_bandwidth': {
            format: value => `${ReportHelper.numberOrZero(value)} KBPS`,
          },
          'sum_view_time': {
            format: value => `${ReportHelper.numberOrZero(value)} Seconds`,
          },
          'view_unique_audience': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'view_unique_audience_dvr': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'view_unique_engaged_users': {
            format: value => ReportHelper.numberOrZero(value),
          },
        }
      },
    };
  }
}
