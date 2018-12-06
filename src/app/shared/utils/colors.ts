const palettes = {
  default: ['#DFE9FF', '#B5CDFC', '#88ACF6', '#6391ED', '#487ADF', '#3567CA', '#2655B0', '#1D4694'],
  viewers: ['#AEF4E9', '#82EEDC', '#60E4CC', '#44D4BB', '#31BEA6', '#24A18C', '#1B8271', '#146E5F'],
  time: ['#FFE2A2', '#FDD27E', '#F7C25C', '#EEAC41', '#E1962E', '#D68021', '#D06E1B', '#CE5E19'],
  dropoff: ['#D8F5D2', '#C3F1B6', '#ACEA9D', '#97DE85', '#81CC6F', '#6DB35B', '#569247', '#3D6E34'],
  entries: ['#E8D7FF', '#D2B3FD', '#BD93F8', '#AB78F1', '#9B64E6', '#8A54D7', '#7B47C3', '#6C3DAD']
};

export function getColorPalette(type: string = 'default'): string[] {
  const palette = palettes[type] ? type : 'default';
  return palettes[palette];
}

export function getPrimaryColor(type: string = 'default'): string {
  const palette = palettes[type] ? type : 'default';
  return palettes[palette][4];
}

export function getSecondaryColor(type: string = 'default'): string {
  const palette = palettes[type] ? type : 'default';
  return palettes[palette][2];
}

export function getColorPercent(percent: number, type: string = 'default'): string {
  const palette = palettes[type] ? type : 'default';
  let index = Math.round(percent / 100 * 8) - 1;
  index = index < 0 ? 0 : index;
  return palettes[palette][index];
}
