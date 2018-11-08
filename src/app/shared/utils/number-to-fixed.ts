export function numberToFixed(number: any, fractions = 2): number {
  number = parseFloat(number) || 0;
  if (number % 1 !== 0) {
    number = Number(number.toFixed(fractions));
  }
  
  return number;
}
