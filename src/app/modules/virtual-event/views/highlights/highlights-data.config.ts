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
          'registered_unique_users': {
            format: value => value,
            graphTooltip: (value) => ReportHelper.numberOrZero(value) + '%',
            colors: [getPrimaryColor(), getSecondaryColor()],
          },
          'attendance_unique_users': {
            format: value => value,
            graphTooltip: (value) => ReportHelper.numberOrZero(value) + '%',
            colors: [getPrimaryColor(), getSecondaryColor()],
          }
        }
      },
      [ReportDataSection.totals]: {
        preSelected: 'registered_unique_users',
        fields: {
          'registered_unique_users': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.ve.registered`),
          },
          'attendance_unique_users': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.ve.attended`),
          }
        }
      }
    };
  }
}
