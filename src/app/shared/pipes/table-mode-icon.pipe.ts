import { Pipe, PipeTransform } from '@angular/core';

export enum TableModes {
  dates = 'dates',
  users = 'users',
  entries = 'entries',
}

@Pipe({
  name: 'tableModeIcon'
})
export class TableModeIconPipe implements PipeTransform {
  transform(value: TableModes): string {
    switch (value) {
      case TableModes.users:
        return 'kIconuser';
      case TableModes.dates:
        return 'kIconcalendar';
      case TableModes.entries:
        return 'kIconUnknown';
      default:
        return '';
    }
  }

}
