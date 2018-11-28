import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appDeviceIcon'
})
export class DeviceIconPipe implements PipeTransform {
  devices = {
    'COMPUTER': 'icon-desktop',
    'TABLET': 'icon-tablet',
    'MOBILE': 'icon-phone',
    'GAME_CONSOLE': 'kIcondevices',
    'OTHER': 'kIcondevices'
  };

  transform(device: string): string {
    if (this.devices.hasOwnProperty(device)) {
      return this.devices[device];
    }

    return '';
  }
}
