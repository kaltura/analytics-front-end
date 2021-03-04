import { Injectable, KeyValueDiffer, KeyValueDiffers, OnDestroy } from '@angular/core';
import { ReportService } from 'src/app/shared/services';
import { KalturaEndUserReportInputFilter, KalturaReportType } from 'kaltura-ngx-client';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';

export interface FilterConfigProp {
  property: 'entryIdIn' | 'userIds' | 'playlistIdIn' | 'rootEntryIdIn' | 'categoriesIdsIn' | 'playbackTypeIn';
  value: string;
}

export interface FilterConfig {
  items?: FilterConfigProp[];
  reportType?: KalturaReportType;
}

@Injectable()
export class FilterBaseService implements OnDestroy {
  protected _reportType: KalturaReportType;
  protected _dateFilterDiffer: KeyValueDiffer<DateChangeEvent, any>;
  protected _filter = new KalturaEndUserReportInputFilter({
    searchInTags: true,
    searchInAdminTags: false
  });

  public requireReload = false;

  public set filterConfig (config: FilterConfig) {
    this.requireReload = this.checkRequireReload(config);
    if (config.reportType) {
      this._reportType = config.reportType;
    }
    if (config.items && config.items.length) {
      config.items.forEach((item: FilterConfigProp) => {
        this._filter[item.property] = item.value;
      });
    }
  }
  constructor(protected _reportService: ReportService,
              protected _objectDiffers: KeyValueDiffers) {
    this._dateFilterDiffer = this._objectDiffers.find([]).create();
  }

  private checkRequireReload(newConfig: FilterConfig): boolean {
    let reload = false;
    newConfig.items.forEach(item => {
      // check for category changes
      if (item.property === 'categoriesIdsIn' && this._filter.categoriesIdsIn && this._filter.categoriesIdsIn.toString() !== item.value.toString()) {
        // category change (we had a category on the filter and now we have a new category)
        reload = true;
      }
      // TODO: check for additional changes if needed
    })
    return reload;
  }

  ngOnDestroy() {

  }
}
