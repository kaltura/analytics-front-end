export function devicesFilterToServerValue(value: string[]): string {
  if (!Array.isArray(value)) {
    return null;
  }

  const otherIndex = value.indexOf('OTHER');
  if (otherIndex !== -1) {
    value.splice(otherIndex, 1, ...['DIGITAL_MEDIA_RECEIVER', 'GAME_CONSOLE', 'UNKNOWN', 'CDN', 'MEDIA_SERVER']);
  }
  
  return value.join(',');
}
