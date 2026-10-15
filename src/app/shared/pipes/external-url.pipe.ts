import { Pipe, PipeTransform } from '@angular/core';
import { toExternalUrl, toFaviconUrl } from 'shared/utils/external-url';

@Pipe({
  name: 'appExternalUrl'
})
export class ExternalUrlPipe implements PipeTransform {
  transform(value: string): string {
    return toExternalUrl(value);
  }
}

@Pipe({
  name: 'appFaviconUrl'
})
export class FaviconUrlPipe implements PipeTransform {
  // an empty src fires the image error event, so invalid domains fall back to the default icon
  transform(domain: string): string {
    return toFaviconUrl(domain) || '';
  }
}
