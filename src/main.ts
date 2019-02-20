import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { analyticsConfig } from 'configuration/analytics-config';

if (environment.production) {
  enableProdMode();
  console.log(`Running Analytics version '${analyticsConfig.appVersion}' (Production mode)`);
} else {
  console.log(`Running Analytics version '${analyticsConfig.appVersion}' (Development mode)`);
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
