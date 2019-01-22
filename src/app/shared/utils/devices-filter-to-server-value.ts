import { analyticsConfig } from 'configuration/analytics-config';

export function devicesFilterToServerValue(value: string[]): string {
  if (!Array.isArray(value) || !value.length) {
    return null;
  }
  
  let result = value;
  const otherIndex = value.indexOf('OTHER');
  if (otherIndex !== -1) {
    result = [
      ...value.slice(0, otherIndex),
      ...['Digital media receiver', 'Unknown', 'CDN', 'Media Server'],
      ...value.slice(otherIndex + 1),
    ];
  }
  
  return result.join(analyticsConfig.valueSeparator);
}
