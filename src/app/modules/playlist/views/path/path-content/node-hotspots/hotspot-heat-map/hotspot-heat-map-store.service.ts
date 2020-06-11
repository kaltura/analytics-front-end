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
export class HotspotHeatMapStoreService {
  private _cache: HeatMapCache = {};
  private _pager = new KalturaFilterPager({ pageSize: 500, pageIndex: 1 });
  private _localConfig = {
    table: {
      fields: {
        'percentile': {
          format: value => value,
        },
        'count_node_switch': {
          format: value => value,
        },
        'count_hotspot_clicked': {
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

  public getHeatMap(hotspotType: string, hotspotId: string, filter: KalturaEndUserReportInputFilter): Observable<HeatMapPoints> {
    if (!this._cache[`${hotspotId}`]) {
      const hotspotFilter = Object.assign(KalturaObjectBaseFactory.createObject(filter), filter); // don't mess with original filter
      hotspotFilter.hotspotIdIn = hotspotId;
      const reportConfig: ReportConfig = {
        filter: hotspotFilter,
        reportType: hotspotType === 'nodeSwitch' ? reportTypeMap(KalturaReportType.interactiveVideoNodeSwitchHotspotClickedPercentiles) : reportTypeMap(KalturaReportType.interactiveVideoHotspotClickedPercentiles),
        pager: this._pager,
        order: null,
      };
      this._cache[`${hotspotId}`] = this._reportService.getReport(reportConfig, this._localConfig, false)
        .pipe(
          map(report => {
            if (!report.table || !report.table.data || !report.table.header) {
              return Array.from({ length: 101 }, () => 0);
            }

            const { tableData } = this._reportService.parseTableData(report.table, this._localConfig.table);

            // if we get 101 data points, remove the last data point
            if (report.table.totalCount === 101 && tableData.length) {
              tableData.pop();
            }

            const field = hotspotType === 'nodeSwitch' ?  'count_node_switch' : 'count_hotspot_clicked';
            return tableData
              .sort((a, b) => Number(a['percentile']) - Number(b['percentile']))
              .map(item => Number(item[field]));
          }),
          publishReplay(1),
          refCount()
        );
    }
    return this._cache[`${hotspotId}`];
  }
}
