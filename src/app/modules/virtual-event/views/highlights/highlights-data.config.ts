import { Injectable } from '@angular/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import {TranslateService} from "@ngx-translate/core";
import {ReportHelper} from "shared/services";
import {getPrimaryColor, getSecondaryColor} from "shared/utils/colors";

@Injectable()
export class HighlightsDataConfig extends ReportDataBaseConfig {

  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'registered': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
          },
          'confirmed': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
          },
          'participated': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
          },
          'unregistered': {
            format: value => value,
            colors: [getPrimaryColor(), getSecondaryColor()],
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'registered',
        fields: {
          'registered': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.ve.registered`),
          },
          'confirmed': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.ve.confirmed`),
          },
          'participated': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.ve.participated`),
          },
          'unregistered': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.ve.unregistered`),
          }
        }
      }
    };
  }
}
