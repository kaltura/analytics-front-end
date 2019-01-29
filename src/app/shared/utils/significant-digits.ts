export function significantDigits(number: any, fractions = 1): number {
  number = parseFloat(number) || 0;
  if (number % 1 !== 0) {
    if (number > 0 && number < 1) { // 0.n
      number = Number(number.toFixed(1 - Math.floor(Math.log(number) / Math.log(10))));
    } else { // n.m
      number = Number(number.toFixed(fractions));
    }
  }
  
  return number;
}
