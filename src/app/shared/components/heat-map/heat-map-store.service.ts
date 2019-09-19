import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';
import { ReportConfig, ReportService } from 'shared/services';
import { KalturaEndUserReportInputFilter, KalturaFilterPager, KalturaObjectBaseFactory, KalturaReportType } from 'kaltura-ngx-client';
import { reportTypeMap } from 'shared/utils/report-type-map';

export type HeatMapPoints = number[];

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
        'percentile': {
          format: value => value,
        },
        'count_viewers': {
          format: value => value,
        },
      }
    }
  };
  
  constructor(private _reportService: ReportService) {
  
  }
  
  
  public clearCache(): void {
    this._cache = {};
  }
  
  public getHeatMap(userId: string, entryId: string, filter: KalturaEndUserReportInputFilter): Observable<HeatMapPoints> {
    if (!this._cache[`${userId}_${entryId}`]) {
      const userFilter = Object.assign(KalturaObjectBaseFactory.createObject(filter), filter); // don't mess with original filter
      userFilter.userIds = userId;
      const reportConfig: ReportConfig = {
        filter: userFilter,
        reportType: reportTypeMap(KalturaReportType.percentiles),
        pager: this._pager,
        objectIds: entryId,
        order: null,
      };
      this._cache[`${userId}_${entryId}`] = this._reportService.getReport(reportConfig, this._localConfig, false)
        .pipe(
          map(report => {
            if (!report.table || !report.table.data || !report.table.header) {
              return Array.from({ length: 101 }, () => 0);
            }
  
            const { tableData } = this._reportService.parseTableData(report.table, this._localConfig.table);

            // if we get 101 data points, remove the first data point as it always contains 0
            if (report.table.totalCount === 101 && tableData.length) {
              tableData.shift();
            }

            return tableData
              .sort((a, b) => Number(a['percentile']) - Number(b['percentile']))
              .map(item => Number(item['count_viewers']));
          }),
          publishReplay(1),
          refCount()
        );
    }
    
    return this._cache[`${userId}_${entryId}`];
  }
}
