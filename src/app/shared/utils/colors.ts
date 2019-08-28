const palettes = {
  default: ['#DFE9FF', '#B5CDFC', '#88ACF6', '#6391ED', '#487ADF', '#3567CA', '#2655B0', '#1D4694'],
  impressions: ['#dff8ff', '#b4eafb', '#8adcf6', '#45c2ea', '#16a8d7', '#0192bf', '#00789d', '#005a75'],
  viewers: ['#AEF4E9', '#82EEDC', '#60E4CC', '#44D4BB', '#31BEA6', '#24A18C', '#1B8271', '#146E5F'],
  time: ['#FFE2A2', '#FDD27E', '#F7C25C', '#EEAC41', '#E1962E', '#D68021', '#D06E1B', '#CE5E19'],
  dropoff: ['#D8F5D2', '#C3F1B6', '#ACEA9D', '#97DE85', '#81CC6F', '#6DB35B', '#569247', '#3D6E34'],
  entries: ['#E8D7FF', '#D2B3FD', '#BD93F8', '#AB78F1', '#9B64E6', '#8A54D7', '#7B47C3', '#6C3DAD'],
  moderation: ['#FAD9DC', '#F8A4A9', '#F3737B', '#EB4D56', '#E0313A', '#CE2026', '#BA1519', '#A31011'],
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
  return palettes[palette][1];
}

export function getColorPercent(percent: number, type: string = 'default'): string {
  const palette = palettes[type] ? type : 'default';
  let index = Math.round(percent / 100 * 8) - 1;
  index = index < 1 ? 1 : index;
  return palettes[palette][index];
}

export function getColorsBetween(startColor: string, endColor: string, numColors: number = 0): string[] {
  const rgbToHex = function(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const hexToRgb = function(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
      : null;
  };

  if (numColors === 0) {
    return [];
  } else if (numColors === 1) {
    return [getPrimaryColor()];
  } else if (numColors === 2) {
    return [getSecondaryColor(), getPrimaryColor()];
  } else {
    let ramp = [];
    ramp.push(startColor);
    const startColorRgb = hexToRgb(startColor);
    const endColorRgb = hexToRgb(endColor);
    const rInc = Math.round((endColorRgb.r - startColorRgb.r) / (numColors - 1));
    const gInc = Math.round((endColorRgb.g - startColorRgb.g) / (numColors - 1));
    const bInc = Math.round((endColorRgb.b - startColorRgb.b) / (numColors - 1));
    for (let i = 0; i < (numColors - 2); i++) {
      startColorRgb.r += rInc;
      startColorRgb.g += gInc;
      startColorRgb.b += bInc;
      ramp.push(rgbToHex(startColorRgb.r, startColorRgb.g, startColorRgb.b));
    }
    ramp.push(endColor);
    return ramp;
  }

}
