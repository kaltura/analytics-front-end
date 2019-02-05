import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appBrowserImage'
})
export class BrowserImagePipe implements PipeTransform {
  private _browsers = {
    'Chrome': 'Chrome',
    'Microsoft Edge': 'Edge',
    'Internet Explorer': 'Explorer',
    'Firefox': 'FF',
    'Opera': 'Opera',
    'Safari': 'Safari',
  };

  transform(device: string): string {
    if (this._browsers.hasOwnProperty(device)) {
      return `assets/browsers/${this._browsers[device]}.png`;
    }

    return null;
  }
}
