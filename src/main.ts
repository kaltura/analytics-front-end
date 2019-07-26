import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { analyticsConfig, initConfig } from 'configuration/analytics-config';
import { catchError, switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';

if (environment.production) {
  enableProdMode();
  console.log(`Running Analytics version '${analyticsConfig.appVersion}' (Production mode)`);
} else {
  console.log(`Running Analytics version '${analyticsConfig.appVersion}' (Development mode)`);
}

initConfig()
  .pipe(
    switchMap(() => platformBrowserDynamic().bootstrapModule(AppModule)),
    catchError(err => (console.error(err), EMPTY))
  )
  .subscribe();
