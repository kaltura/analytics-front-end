import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { GraphType, ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';
import { ReportHelper } from 'shared/services';

@Injectable()
export class LiveDiscoveryConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public static mapTotalsMetric(metric: string): string {
    switch (metric) {
      case 'view_unique_audience_dvr':
        return 'avg_view_dvr';
      case 'view_unique_engaged_users':
        return 'avg_view_engagement';
      case 'none':
        return null;
      default:
        return metric;
    }
  }

  public getConfig(authUsers = false): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          [authUsers ? 'view_unique_audience' : 'viewers']: {
            format: value => Math.round(value),
            colors: ['#31bea6'],
            graphType: GraphType.line,
            graphTooltip: value => authUsers
              ? `${this._translate.instant('app.entryLive.discovery.viewers')}: ${ReportHelper.numberOrZero(value)}`
              : `${this._translate.instant('app.entryLive.discovery.view_unique_audience')}: ${ReportHelper.numberOrZero(value)}`,
            sortOrder: 1,
            group: 'engagement',
          },
          [authUsers ? 'view_unique_audience_dvr' : 'viewers_dvr']: {
            format: value => Math.round(value),
            colors: ['#60e4cc'],
            graphType: GraphType.line,
            graphTooltip: value => authUsers
              ? `${this._translate.instant('app.entryLive.discovery.viewers_dvr')}: ${ReportHelper.numberOrZero(value)}`
              : `${this._translate.instant('app.entryLive.discovery.view_unique_audience_dvr')}: ${ReportHelper.numberOrZero(value)}`,
            sortOrder: 2,
            group: 'engagement',
          },
          [authUsers ? 'view_unique_engaged_users' : 'viewers_engagement']: {
            format: value => Math.round(value),
            colors: ['#1b8271'],
            graphType: GraphType.line,
            graphTooltip: value => authUsers
              ? `${this._translate.instant('app.entryLive.discovery.viewers_engagement')}: ${ReportHelper.numberOrZero(value)}`
              : `${this._translate.instant('app.entryLive.discovery.view_unique_engaged_users')}: ${ReportHelper.numberOrZero(value)}`,
            sortOrder: 3,
            group: 'engagement',
          },
          'sum_view_time': {
            format: value => Math.round(value),
            colors: ['#e1962e'], // replace with relevant color
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.sum_view_time')}: ${ReportHelper.numberOrZero(value)} Seconds`,
            units: () => 'Seconds',
            sortOrder: 4,
            group: 'engagement',
          },
          'avg_view_bitrate': {
            format: value => Number(value).toFixed(1),
            colors: ['#FDD27E'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_bitrate')}: ${ReportHelper.numberOrZero(value, false)} Kbps`,
            units: () => 'Kbps',
            sortOrder: 5,
            group: 'qualityOfService',
          },
          'view_buffer_time_ratio': {
            format: value => (value * 100).toFixed(1),
            colors: ['#EEAC41'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.view_buffer_time_ratio')}: ${ReportHelper.percents(value / 100, false)}`,
            units: () => '%',
            sortOrder: 6,
            group: 'qualityOfService',
          },
          'avg_view_dropped_frames_ratio': {
            format: value => (value * 100).toFixed(1),
            colors: ['#D68021'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_dropped_frames_ratio')}: ${ReportHelper.percents(value / 100, false)}`,
            units: () => '%',
            sortOrder: 7,
            group: 'qualityOfService',
          },
          'avg_view_segment_download_time_sec': {
            format: value => parseFloat(value).toFixed(2),
            colors: ['#BD93F8'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_segment_download_time_sec')}: ${ReportHelper.numberOrZero(value)} Seconds`,
            units: () => 'Seconds',
            sortOrder: 8,
            group: 'qualityOfService',
          },
          'avg_view_manifest_download_time_sec': {
            format: value => parseFloat(value).toFixed(2),
            colors: ['#8A54D7'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_manifest_download_time_sec')}: ${ReportHelper.numberOrZero(value)} Seconds`,
            units: () => 'Seconds',
            sortOrder: 9,
            group: 'qualityOfService',
          },
          'avg_view_live_latency': {
            format: value => Math.round(value),
            colors: ['#f3737b'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_live_latency')}: ${ReportHelper.numberOrZero(value)} Seconds`,
            units: () => 'Seconds',
            sortOrder: 10,
            group: 'qualityOfService',
          },
          'avg_view_downstream_bandwidth': {
            format: value => Math.round(value),
            colors: ['#e0313a'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_downstream_bandwidth')}: ${ReportHelper.numberOrZero(value)} Kbps`,
            units: () => 'Kbps',
            sortOrder: 11,
            group: 'qualityOfService',
          },
          'error': {
            format: value => Math.round(value),
            colors: ['#BA1519'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.error')}: ${ReportHelper.numberOrZero(value)}`,
            sortOrder: 12,
            group: 'qualityOfService',
          },
        }
      },
      [ReportDataSection.totals]: {
        fields: {
          'avg_view_dropped_frames_ratio': {
            format: value => ReportHelper.percents(value, false),
          },
          'avg_view_bitrate': {
            format: value => `${ReportHelper.numberOrZero(value, false)} Kbps`,
          },
          'avg_view_live_latency': {
            format: value => `${ReportHelper.numberOrZero(value)} Seconds`,
          },
          'avg_view_downstream_bandwidth': {
            format: value => `${ReportHelper.numberOrZero(value)} Kbps`,
          },
          'sum_view_time': {
            format: value => `${ReportHelper.numberOrZero(value)} Seconds`,
          },
          'view_unique_audience': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'viewers': {
            format: value => ReportHelper.numberOrZero(value),
          },
          'avg_view_dvr': {
            format: value => ReportHelper.numberOrZero(value, false),
          },
          'viewers_dvr': {
            format: value => ReportHelper.numberOrZero(value, false),
          },
          'avg_view_engagement': {
            format: value => ReportHelper.percents(value, false),
          },
          'viewers_engagement': {
            format: value => ReportHelper.numberOrZero(value, false),
          },
          'view_buffer_time_ratio': {
            format: value => ReportHelper.percents(value, false),
          },
          'avg_view_segment_download_time_sec': {
            format: value => `${ReportHelper.numberOrZero(value)} Seconds`,
          },
          'avg_view_manifest_download_time_sec': {
            format: value => `${ReportHelper.numberOrZero(value)} Seconds`,
          },
          'error': {
            format: value => ReportHelper.numberOrZero(value, false),
          }
        }
      },
    };
  }
}
