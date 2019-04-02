const countryNames = [
  'Taiwan, Province of China',
  'Hong Kong'
];

export function canDrillDown(countryName: string): boolean {
  return countryNames.indexOf(countryName) === -1;
}
