import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appOSImage'
})
export class OsImagePipe implements PipeTransform {
  private _browsers = {
    'Android': 'android',
    'Android (Google TV)': 'android',
    'Chrome OS': 'chrome_os',
    'iOS': 'ios',
    'Linux': 'linux',
    'Linux (Kindle)': 'linux',
    'Mac OS X': 'mac_os',
    'Mac OS': 'mac_os',
    'Sony Playstation': 'sony_playstation',
    'Windows': 'windows',
    'Ubuntu': 'ubuntu',
    'Xbox': 'xbox',
  };

  transform(device: string): string {
    if (this._browsers.hasOwnProperty(device)) {
      return `assets/operating-systems/${this._browsers[device]}.png`;
    }

    return null;
  }
}
