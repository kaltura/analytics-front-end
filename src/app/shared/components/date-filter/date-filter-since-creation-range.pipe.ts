import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'sinceCreationRange'
})
export class DateFilterSinceCreationRangePipe implements PipeTransform {
  transform(createdAt: moment.Moment): string {
    return `${createdAt.format('MMM D, YYYY')} - ${moment().format('MMM D, YYYY')}`;
  }
}
