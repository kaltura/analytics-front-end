import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appTrend'
})
export class TrendPipe implements PipeTransform {
  transform(value: number): string {
    if (value > 0) {
      return 'icon-progress';
    }
    
    if (value < 0) {
      return 'icon-regression';
    }
  
    return '';
  }
}
