export function devicesFilterToServerValue(value: string[]): string {
  if (!Array.isArray(value)) {
    return null;
  }
  
  let result = value;
  const otherIndex = value.indexOf('OTHER');
  if (otherIndex !== -1) {
    result = [
      ...value.slice(0, otherIndex),
      ...['DIGITAL_MEDIA_RECEIVER', 'GAME_CONSOLE', 'UNKNOWN', 'CDN', 'MEDIA_SERVER'],
      ...value.slice(otherIndex + 1),
    ];
  }
  
  return result.join(',');
}
