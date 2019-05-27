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
            format: value => (value * 100).toFixed(1),
            colors: ['#9b64e6'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_dropped_frames_ratio')}: ${ReportHelper.percents(value / 100, false)}`,
            units: () => '%',
            sortOrder: 1,
          },
          'view_unique_buffering_users': {
            format: value => (value * 100).toFixed(1),
            colors: ['#e1962e'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.view_unique_buffering_users')}: ${ReportHelper.percents(value / 100, false)}`,
            units: () => '%',
            sortOrder: 2,
          },
          'avg_view_bitrate': {
            format: value => value,
            colors: ['#f7c25c'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_bitrate')}: ${ReportHelper.numberOrZero(value)} Kbps`,
            units: () => 'Kbps',
            sortOrder: 3,
          },
          'avg_view_latency': {
            format: value => (value * 100).toFixed(1),
            colors: ['#f3737b'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_latency')}: ${ReportHelper.percents(value / 100, false)}`,
            units: () => '%',
            sortOrder: 4,
          },
          'avg_view_downstream_bandwidth': {
            format: value => value,
            colors: ['#e0313a'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.avg_view_downstream_bandwidth')}: ${ReportHelper.numberOrZero(value)} Sec`,
            units: () => 'Sec',
            sortOrder: 5,
          },
          'sum_view_time': {
            format: value => value,
            colors: ['#487adf'], // replace with relevant color
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.sum_view_time')}: ${ReportHelper.numberOrZero(value)} Sec`,
            units: () => 'Sec',
            sortOrder: 6,
          },
          'view_unique_audience': {
            format: value => value,
            colors: ['#31bea6'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.view_unique_audience')}: ${ReportHelper.numberOrZero(value)}`,
            sortOrder: 7,
          },
          'view_unique_audience_dvr': {
            format: value => value,
            colors: ['#60e4cc'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.view_unique_audience_dvr')}: ${ReportHelper.numberOrZero(value)}`,
            sortOrder: 8,
          },
          'view_unique_engaged_users': {
            format: value => value,
            colors: ['#1b8271'],
            graphType: GraphType.line,
            graphTooltip: value => `${this._translate.instant('app.entryLive.discovery.view_unique_engaged_users')}: ${ReportHelper.numberOrZero(value)}`,
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
            format: value => ReportHelper.percents(value, false),
          },
          'avg_view_bitrate': {
            format: value => `${value} Kbps`,
          },
          'avg_view_latency': {
            format: value => ReportHelper.percents(value, false),
          },
          'avg_view_downstream_bandwidth': {
            format: value => `${value} Sec`,
          },
          'sum_view_time': {
            format: value => `${value} Sec`,
          },
          'view_unique_audience': {
            format: value => value,
          },
          'view_unique_audience_dvr': {
            format: value => value,
          },
          'view_unique_engaged_users': {
            format: value => value,
          },
        }
      },
    };
  }
}
