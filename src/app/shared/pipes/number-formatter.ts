import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'numberFormat'
})
export class NumberFormatPipe implements PipeTransform {
  transform(value: number): string {
    return value.toLocaleString(navigator.language, { maximumSignificantDigits: 10 });
  }
}
