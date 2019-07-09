export function parseFormattedValue(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    value = value.trim();
    // handle all possible (according to wikipedia) separator symbols
    return value ? parseFloat(value.replace(new RegExp(/[,\.\s\'·٫٬⎖]+/, 'g'), '')) : 0;
  }
  
  return 0;
}
