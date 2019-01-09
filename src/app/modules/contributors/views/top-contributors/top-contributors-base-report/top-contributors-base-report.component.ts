import { Input } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { RefineChangeEvent } from '../filter/filter.component';
import { KalturaEndUserReportInputFilter } from 'kaltura-ngx-client';
import { RefineFilter } from 'shared/components/filter/filter.component';

export abstract class TopContributorsBaseReportComponent {
  @Input() set dateFilter(value: DateChangeEvent) {
    if (value) {
      this._dateFilter = value;
      this._updateFilter();
      this._loadReport();
    }
  }
  
  @Input() set refineFilter(value: RefineFilter) {
    if (value) {
      this._refineFilter = value;
      this._updateRefineFilter();
      this._loadReport();
    }
  }
  
  protected _dateFilter: DateChangeEvent;
  protected _refineFilter: RefineFilter = [];
  
  protected abstract _loadReport(): void;
  
  protected abstract _updateFilter(): void;
  
  protected abstract _updateRefineFilter(): void;
  
  protected _refineFilterToServerValue(filter: KalturaEndUserReportInputFilter): void {
    let categories = [], mediaType = [], sourceType = [],
      tags = [], owners = [], country = [], region = [], city = [];
    
    this._refineFilter.forEach(item => {
      switch (item.type) {
        case 'mediaType':
          const value = item.value === 'Live'
            ? 'Live stream,Live stream windows media,Live stream real media,Live stream quicktime'
            : item.value;
          mediaType.push(value);
          break;
        case 'entrySources':
          sourceType.push(item.value);
          break;
        case 'categories':
          categories.push(item.value.id);
          break;
        case 'tags':
          tags.push(item.value);
          break;
        case 'owners':
          owners.push(item.value.id);
          break;
        case 'location':
          if (item.value.country) {
            country.push(item.value.country.map(({ name }) => name));
          }
          if (item.value.region) {
            region.push(item.value.region.map(({ name }) => name));
          }
          if (item.value.city) {
            city.push(item.value.city.map(({ name }) => name));
          }
          break;
      }
    });
    
    if (categories.length) {
      filter.categoriesIdsIn = categories.join(',');
    } else {
      delete filter.categoriesIdsIn;
    }
    
    if (mediaType.length) {
      filter.mediaTypeIn = mediaType.join(',');
    } else {
      delete filter.mediaTypeIn;
    }
    
    if (sourceType.length) {
      filter.sourceTypeIn = sourceType.join(',');
    } else {
      delete filter.sourceTypeIn;
    }
    
    if (owners.length) {
      filter.userIds = owners.join(',');
    } else {
      delete filter.userIds;
    }
    
    if (country.length) {
      filter.countryIn = country.join(',');
    } else {
      delete filter.countryIn;
    }
    
    if (region.length) {
      filter.regionIn = region.join(',');
    } else {
      delete filter.regionIn;
    }
    
    if (city.length) {
      filter.citiesIn = city.join(',');
    } else {
      delete filter.citiesIn;
    }
    
    if (tags.length) {
      filter.keywords = tags.join(',');
    } else {
      delete filter.keywords;
    }
  }
}
