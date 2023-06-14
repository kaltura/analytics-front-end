import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';
import { ReportConfig, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportType } from 'kaltura-ngx-client';
import { reportTypeMap } from 'shared/utils/report-type-map';

export type HeatMapPoints = string[];

export interface HeatMapCache {
  [key: string]: Observable<HeatMapPoints>;
}

@Injectable()
export class HeatMapStoreService {
  private _cache: HeatMapCache = {};
  private _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _localConfig = {
    table: {
      fields: {
        'position': {
          format: value => value,
        },
        'user_engagement': {
          format: value => value,
        },
        'count_viewers': {
          format: value => value,
        }
      }
    }
  };

  private user_engagement_values = {
    'high': 6,
    'good': 5,
    'fair': 4,
    'low': 3,
    'non': 2,
    'offline': 1
  }

  constructor(private _reportService: ReportService) {

  }


  public clearCache(): void {
    this._cache = {};
  }

  public getHeatMap(userId: string, entryId: string, filter: KalturaEndUserReportInputFilter): Observable<HeatMapPoints> {
    if (!this._cache[`${userId}_${entryId}`]) {
      const userFilter = Object.assign(KalturaObjectBaseFactory.createObject(filter), filter); // don't mess with original filter
      userFilter.userIds = userId;
      userFilter.entryIdIn = entryId;
      const reportConfig: ReportConfig = {
        filter: userFilter,
        reportType: reportTypeMap(KalturaReportType.epWebcastLiveUserEngagementLevel),
        pager: this._pager,
        order: null,
      };
      this._cache[`${userId}_${entryId}`] = this._reportService.getReport(reportConfig, this._localConfig, false)
        .pipe(
          map(report => {
            if (!report.table || !report.table.data || !report.table.header) {
              return Array.from({ length: 1 }, () => 0);
            }
            const dataPoints = [];
            const { tableData } = this._reportService.parseTableData(report.table, this._localConfig.table);
            if (tableData.length) {
              const getMaxValue = (val1: string, val2: string) => {
                return this.user_engagement_values[val1] > this.user_engagement_values[val2] ? val1 : val2;
              }
              // merge duplicated position and set their user_engagement to the highest value
              const positions = {}; // /create hash map
              tableData.forEach(dataPoint => {
                if (positions[dataPoint.position]) {
                  positions[dataPoint.position] = getMaxValue(positions[dataPoint.position], dataPoint.user_engagement)
                } else {
                  positions[dataPoint.position] = dataPoint.user_engagement;
                }
              })
              Object.keys(positions).forEach(key => dataPoints.push(positions[key]));
            }
            return dataPoints;
          }),
          publishReplay(1),
          refCount()
        );
    }

    return this._cache[`${userId}_${entryId}`];
  }
}
