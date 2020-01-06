const units = [
  'MB',
  'GB',
  'TB',
  'PB'
];

export function fileSize(mBytes: number = 0, precision: number = 2): { value: string, units: string } {
  let result = {
    value: '0',
    units: 'MB'
  };

  if (isNaN(parseFloat(String(mBytes))) || !isFinite(mBytes)) {
    return result;
  }
  
  let unit = 0;
  let value = parseFloat(String(mBytes));

  while (value >= 1024) {
    value /= 1024;
    unit++;
  }
  
  precision = value !== 0 ? +precision : 0;
  
  result = {
    value: value.toFixed(precision),
    units: units[unit]
  };

  return result;
}
