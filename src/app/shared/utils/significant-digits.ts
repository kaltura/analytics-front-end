export function significantDigits(number: any, fractions = 2): number {
  number = parseFloat(number) || 0;
  if (number % 1 !== 0) {
    if (number < 1) {
      number = Number(number.toFixed(1 - Math.floor(Math.log(number) / Math.log(10))));
    } else {
      number = Number(number.toFixed(fractions));
    }
  }
  
  return number;
}
