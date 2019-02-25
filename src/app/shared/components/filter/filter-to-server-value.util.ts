import {
  KalturaEndUserReportInputFilter,
  KalturaESearchEntryFieldName,
  KalturaESearchEntryItem,
  KalturaESearchEntryOperator,
  KalturaESearchItemType,
  KalturaESearchOperatorType,
  KalturaReportInputFilter
} from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { RefineFilter } from 'shared/components/filter/filter.component';

export function refineFilterToServerValue(refineFilter: RefineFilter, serverFilter: KalturaEndUserReportInputFilter | KalturaReportInputFilter): void {
  let categories = [], mediaType = [], sourceType = [],
    tags = [], owners = [], country = [], region = [], city = [], domains = [], users = [];
  
  refineFilter.forEach(item => {
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
      case 'users':
        users.push(item.value.id);
        break;
      case 'countries':
        country.push(item.value.name);
        break;
      case 'domains':
        domains.push(item.value.name);
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
    serverFilter.categoriesIdsIn = categories.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.categoriesIdsIn;
  }
  
  if (mediaType.length) {
    serverFilter.mediaTypeIn = mediaType.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.mediaTypeIn;
  }
  
  if (sourceType.length) {
    serverFilter.sourceTypeIn = sourceType.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.sourceTypeIn;
  }
  
  if (owners.length) {
    serverFilter.ownerIdsIn = owners.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.ownerIdsIn;
  }

  if (users.length) {
    (serverFilter as KalturaEndUserReportInputFilter).userIds = users.join(analyticsConfig.valueSeparator);
  } else {
    delete (serverFilter as KalturaEndUserReportInputFilter).userIds;
  }

  if (country.length) {
    serverFilter.countryIn = country.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.countryIn;
  }
  
  if (region.length) {
    serverFilter.regionIn = region.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.regionIn;
  }
  
  if (city.length) {
    serverFilter.citiesIn = city.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.citiesIn;
  }

  if (tags.length) {
    serverFilter.entryOperator = new KalturaESearchEntryOperator({
        operator: KalturaESearchOperatorType.orOp,
        searchItems: []
      }
    );
    tags.forEach( tag => {
      serverFilter.entryOperator.searchItems.push(new KalturaESearchEntryItem({
        itemType: KalturaESearchItemType.exactMatch,
        fieldName: KalturaESearchEntryFieldName.tags,
        searchTerm: tag
      }));
    });
  } else {
    delete serverFilter.entryOperator;
  }
}

