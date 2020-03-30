import { Pipe, PipeTransform } from '@angular/core';

export enum TableModes {
  dates = 'dates',
  users = 'users',
  devices = 'devices',
  entries = 'entries',
  context = 'context',
  user = 'user',
  entry = 'entry'
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
        return 'icon-devices';
      case TableModes.entries:
        return 'kIconUnknown';
      case TableModes.context:
        return 'kIconfolder';
      default:
        return '';
    }
  }

}
