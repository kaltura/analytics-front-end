import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { BrowserService, ReportHelper } from 'shared/services';
import { EChartOption } from 'echarts';
import { getColorPalette } from 'shared/utils/colors';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Injectable()
export class StatusDataConfig extends ReportDataBaseConfig implements OnDestroy {
  private _labelColor: string;
  private _labelBackground = {};

  constructor(_translate: TranslateService,
              private _browserService: BrowserService) {
    super(_translate);
    this._setLabelColor(this._browserService.isContrasTheme);
    this._browserService.contrastThemeChange$
      .pipe(cancelOnDestroy(this))
      .subscribe(isContrast => this._setLabelColor(isContrast));
  }

  ngOnDestroy(): void {
  }

  private _setLabelColor(isContrast: boolean): void {
    this._labelColor = isContrast ? '#333333' : '#999999';
    this._labelBackground = isContrast ? { backgroundColor: 'black', padding: 3 } : { backgroundColor: 'transparent', padding: 0 };
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
        data: []
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
