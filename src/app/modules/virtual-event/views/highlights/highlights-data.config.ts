import { Injectable } from '@angular/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import {TranslateService} from "@ngx-translate/core";
import {ReportHelper} from "shared/services";
import {getPrimaryColor, getSecondaryColor} from "shared/utils/colors";
import {DateFilterUtils} from "shared/components/date-filter/date-filter-utils";
import {analyticsConfig} from "configuration/analytics-config";

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
      },
      [ReportDataSection.table]: {
        fields: {
          'date_id': {
            format: value => DateFilterUtils.formatFullDateString(value),
            nonComparable: true,
          },
          'registered': {
            format: value => ReportHelper.numberOrZero(value, true),
            sortOrder: 1
          },
          'confirmed': {
            format: value => ReportHelper.numberOrZero(value, true),
            sortOrder: 2
          },
          'participated': {
            format: value => ReportHelper.numberOrZero(value, true),
            sortOrder: 3
          },
          'unregistered': {
            format: value => ReportHelper.numberOrZero(value, true),
            sortOrder: 4
          }
        }
      }
    };
  }
}