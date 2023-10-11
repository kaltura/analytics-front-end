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

  constructor(private _reportService: ReportService) {

  }


  public clearCache(): void {
    this._cache = {};
  }

  public isEngaged = str =>
    (str.indexOf('TabFocused') > -1 && str.indexOf('SoundOn') > -1) || // player or room with sound and tab focused
    (str.indexOf('FullScreen') > -1 && str.indexOf('Camera') > -1 && str.indexOf('FullScreenOff') === -1) || // room in full screen
    str.indexOf('CameraOn') > -1 || // room with camera on
    str.indexOf('OnStage') > -1; // room on stage

  public getHeatMap(userId: string, entryId: string, filter: KalturaEndUserReportInputFilter, actualStartDate: Date): Observable<HeatMapPoints> {
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
                if (val1 === 'Offline' || val2 === 'Offline') {
                  return val1 === 'Offline' ? val2 : val1;
                } else {
                  return this.isEngaged(val1) ? val1 : this.isEngaged(val2) ? val2 : val1;
                }
              }
              // merge duplicated position and set their user_engagement to the highest value
              const positions = {}; // /create hash map
              const startTime = actualStartDate.getTime() / 1000;
              tableData.forEach(dataPoint => {
                // filter out points earlier than the actual session start date
                if (parseInt(dataPoint.position) >= startTime) {
                  if (positions[dataPoint.position]) {
                    positions[dataPoint.position] = getMaxValue(positions[dataPoint.position], dataPoint.user_engagement)
                  } else {
                    positions[dataPoint.position] = dataPoint.user_engagement;
                  }
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
