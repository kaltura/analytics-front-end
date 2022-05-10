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

export function refineFilterToServerValue(refineFilter: RefineFilter, serverFilter: KalturaReportInputFilter): void {
  let categories = [], mediaType = [], origin = [], sourceType = [], playbackType = [], devices = [], browsers = [], os = [],
    tags = [], owners = [], country = [], region = [], city = [], domains = [], pages = [], users = [], context = [];

  refineFilter.forEach(item => {
    switch (item.type) {
      case 'playbackType':
        if (item.value === 'all') {
          playbackType.push('live');
          playbackType.push('dvr');
          playbackType.push('vod');
        } else {
          playbackType.push(item.value);
        }
        break;
      case 'devices':
        devices.push(item.value.name);
        break;
      case 'browser':
        browsers.push(item.value.name);
        break;
      case 'os':
        os.push(item.value.name);
        break;
      case 'mediaType':
        const value = item.value === 'Live'
          ? 'Live stream,Live stream windows media,Live stream real media,Live stream quicktime'
          : item.value;
        mediaType.push(value);
        break;
      case 'entrySources':
        sourceType.push(item.value);
        break;
      case 'origin':
        origin.push(item.value);
        break;
      case 'categories':
        categories.push(item.value.id);
        break;
      case 'context':
        context.push(item.value.id);
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
        if (item.value.domains) {
          domains.push(...item.value.domains.map(({ name }) => name));
        }
        if (item.value.pages) {
          pages.push(...item.value.pages.map(({ name }) => name));
        }
        break;
      case 'location':
        if (item.value.country) {
          country.push(...item.value.country.map(({ name }) => name));
        }
        if (item.value.region) {
          region.push(...item.value.region.map(({ name }) => name));
        }
        if (item.value.city) {
          city.push(...item.value.city.map(({ name }) => name));
        }
        break;
    }
  });

  if (categories.length) {
    serverFilter.categoriesIdsIn = categories.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.categoriesIdsIn;
  }

  if (context.length) {
    serverFilter.playbackContextIdsIn = context.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.playbackContextIdsIn;
  }

  if (mediaType.length) {
    serverFilter.mediaTypeIn = mediaType.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.mediaTypeIn;
  }

  if (origin.length) {
    serverFilter.originIn = origin.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.originIn;
  }

  if (playbackType.length) {
    serverFilter.playbackTypeIn = playbackType.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.playbackTypeIn;
  }

  if (devices.length) {
    serverFilter.deviceIn = devices.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.deviceIn;
  }

  if (browsers.length) {
    serverFilter.browserFamilyIn = browsers.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.browserFamilyIn;
  }

  if (os.length) {
    serverFilter.operatingSystemFamilyIn = os.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.operatingSystemFamilyIn;
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

  if (domains.length) {
    serverFilter.domainIn = domains.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.domainIn;
  }

  if (pages.length) {
    serverFilter.canonicalUrlIn = pages.join(analyticsConfig.valueSeparator);
  } else {
    delete serverFilter.canonicalUrlIn;
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

