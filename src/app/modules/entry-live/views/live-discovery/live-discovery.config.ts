import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataBaseConfig, ReportDataConfig, ReportDataSection } from 'shared/services/storage-data-base.config';

@Injectable()
export class LiveDiscoveryConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'view_unique_audience': {
            format: value => value,
          },
          'view_unique_engaged_users': {
            format: value => value,
          },
          'view_unique_buffering_users': {
            format: value => value,
          },
          'avg_view_downstream_bandwidth': {
            format: value => value,
          },
          'view_unique_audience_dvr': {
            format: value => value,
          },
          'avg_view_bitrate': {
            format: value => value,
          },
          'sum_view_time': {
            format: value => value,
          },
          'avg_view_latency': {
            format: value => value,
          },
          'avg_view_dropped_frames_ratio': {
            format: value => value,
          },
        }
      },
    };
  }
}
