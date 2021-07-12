# Analytics Front-End

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.1.4.

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

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Release new version

Install [Brew](https://brew.sh/).
Install gh `brew install gh`.
Login to GitHub `gh auth login`.
Run `ng run build:prod -- v*.*.*` where *.*.* is version number.
