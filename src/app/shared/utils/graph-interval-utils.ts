export function getGraphAxisBoundaries(main: number[], secondary: number[]): { max: number, min: number, interval?: number }[] {
  const createFunc = func => series => parseFloat(func(...[].concat.apply([], series)).toFixed(1));
  const getMaxValue = createFunc(Math.max);
  const getMinValue = createFunc(Math.min);
  const getInterval = (a, b) => b ? getInterval(b, a % b) : Math.abs(a); // greatest common divisor function
  const mainMax = getMaxValue(main) || 1;
  const secondaryMax = getMaxValue(secondary) || 100;
  let mainMin = getMinValue(main);
  let secondaryMin = getMinValue(secondary);

// prevent having min equals max
  mainMin = mainMin === mainMax ? 0 : mainMin;
  secondaryMin = secondaryMin === secondaryMax ? 0 : secondaryMin;
  
  const mainInterval = parseFloat(((mainMax - mainMin) / 5).toFixed(2));
  const secondaryInterval = parseFloat(((secondaryMax - secondaryMin) / 5).toFixed(2));
  
  return [
    {
      max: mainMax,
      min: mainMin,
      // interval: mainInterval,
    },
    {
      max: secondaryMax,
      min: secondaryMin,
      // interval: secondaryInterval,
    },
  ];
}
