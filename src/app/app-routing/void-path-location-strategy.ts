import { LocationChangeListener, PathLocationStrategy } from '@angular/common';
import { Injectable } from '@angular/core';
/**
 * Override the default location strategy
 * We don't want to change the State object.
 */
@Injectable()
export class VoidPathLocationStrategy extends PathLocationStrategy {
  onPopState(fn: LocationChangeListener): void {}
  pushState(state: any, title: string, url: string, queryParams: string): void {}
  replaceState(state: any, title: string, url: string, queryParams: string): void {}
  forward(): void {}
  back(): void {}
}
