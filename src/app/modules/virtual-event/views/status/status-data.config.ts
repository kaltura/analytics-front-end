import { Injectable } from '@angular/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { EChartOption } from 'echarts';
import { TranslateService } from "@ngx-translate/core";
import {ReportHelper} from "shared/services";

@Injectable()
export class StatusDataConfig extends ReportDataBaseConfig {

  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.graph]: {
        fields: {
          'invited': {
            format: value => value,
          },
          'registered': {
            format: value => value,
          },
          'confirmed': {
            format: value => value,
          },
          'participated': {
            format: value => value,
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

  public getChartConfig(): EChartOption {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      yAxis: {
        type: 'value'
      },
      xAxis: {
        type: 'category',
        data: []
      },
      series: [],
      legend: {
        bottom: 20,
        left: 24,
        data: [],
        itemWidth: 10,
        itemHeight: 10,
        icon: 'circle'
      },
      grid: {
        left: 24,
        right: 24,
        top: 40,
        bottom: 70,
        containLabel: true
      },
      textStyle: {
        fontFamily: 'Lato',
      },
    }
  }
}