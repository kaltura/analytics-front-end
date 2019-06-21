export function parseFormattedValue(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    value = value.trim();
    return value ? parseFloat(value.replace(new RegExp(',', 'g'), '')) : 0;
  }
  
  return 0;
}
