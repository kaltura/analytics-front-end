import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appDeviceIcon'
})
export class DeviceIconPipe implements PipeTransform {
  devices = {
    'Computer': 'icon-desktop',
    'Tablet': 'icon-tablet',
    'Mobile': 'icon-phone',
    'Game console': 'icon-game-console',
    'OTHER': 'kIcondevices'
  };

  transform(device: string): string {
    if (this.devices.hasOwnProperty(device)) {
      return this.devices[device];
    }

    return '';
  }
}
