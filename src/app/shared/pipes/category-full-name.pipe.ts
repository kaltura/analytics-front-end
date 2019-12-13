import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appCategoryFullName'
})
export class CategoryFullNamePipe implements PipeTransform {
  transform(value: string): string {
    if (!value || typeof value !== 'string') {
      return value;
    }
    const chunks = value.split('>');
    const lastChunk = `<strong>${chunks[chunks.length - 1]}</strong>`;
    chunks.splice(-1, 1); // remove last chunk
    
    return `${chunks.join(' / ')} ${chunks.length ? '/' : ''} ${lastChunk}`;
  }
}
