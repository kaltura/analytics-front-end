import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appAbs'
})
export class AbsPipe implements PipeTransform {
  transform(value: number): string {
    const result = Math.abs(value);
    return result === NaN ? 'N/A' : String(result);
  }
}
