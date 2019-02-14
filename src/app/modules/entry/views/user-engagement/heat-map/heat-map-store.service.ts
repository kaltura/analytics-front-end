import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { publishReplay, refCount } from 'rxjs/operators';

export type HeatMapPoints = number[];

export interface HeatMapCache {
  [key: string]: Observable<HeatMapPoints>;
}

@Injectable()
export class HeatMapStoreService {
  private _cache: HeatMapCache = {};
  
  public clearCache(): void {
    this._cache = {};
  }
  
  public getHeatMap(userId: string): Observable<HeatMapPoints> {
    if (!this._cache[userId]) {
      // TODO mock data, replace with api call
      this._cache[userId] = Observable
        .of(Array.from({ length: 100 }, () => Math.floor(Math.random() * 4)))
        .pipe(
          publishReplay(1),
          refCount()
        );
    }
    
    return this._cache[userId];
  }
}
