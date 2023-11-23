# Analytics Front-End

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.2.4.

## Development server

* Copy file `src/dev/index.tpl.html` to `src/index.html` (overwrite existing file)
* Fill all params index.html `analyticsConfig` object.
* Run ng serve for a dev server.
* Navigate to http://localhost:4200

## Example

Follow this [link](https://github.com/kaltura/analytics-front-end/tree/master/docs/loadingAnalytics.md) to see the docs

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Release new version

* Run `ng run build:prod v*.*.*` where *.*.* is version number. The zipped version will be generated in the `dist` folder
* Tag a new version on Github and attach the generated zip file to the version
