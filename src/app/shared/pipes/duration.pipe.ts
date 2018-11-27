import { Pipe, PipeTransform } from '@angular/core';
import { ReportHelper } from 'shared/services';

@Pipe({ name: 'appDuration' })
export class DurationPipe implements PipeTransform {
  transform(value: number): string {
    return ReportHelper.time(String(value));
  }
}
