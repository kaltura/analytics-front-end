import { Pipe, PipeTransform } from '@angular/core';

export enum TableModes {
  dates = 'dates',
  users = 'users',
  devices = 'devices',
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
      case TableModes.devices:
        return 'icon-desktop';
      default:
        return '';
    }
  }

}
