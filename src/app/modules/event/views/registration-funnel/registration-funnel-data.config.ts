import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ReportDataConfig, ReportDataSection, ReportDataBaseConfig } from 'shared/services/storage-data-base.config';
import { BrowserService, ReportHelper } from 'shared/services';
import { EChartOption } from 'echarts';
import { getColorPalette } from 'shared/utils/colors';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';

@Injectable()
export class RegistrationFunnelDataConfig extends ReportDataBaseConfig implements OnDestroy {
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
      [ReportDataSection.totals]: {
        fields: {
          'registered': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'confirmed': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'attended': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'participated': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'blocked': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'unregistered': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'invited': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'created': {
            format: value => ReportHelper.numberOrNA(value)
          }
        }
      }
    };
  }

  public getChartConfig(tooltipFormatter): EChartOption {
    return {
      tooltip: {
        backgroundColor: '#ffffff',
        borderColor: '#dadada',
        borderWidth: 1,
        padding: 10,
        extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
        textStyle: {
          color: this._labelColor,
          fontFamily: 'Lato'
        },
        formatter: tooltipFormatter,
        trigger: 'item'
      },
      color: getColorPalette(),
      series: [
        {
          name: 'Registration',
          type: 'funnel',
          left: '45%',
          top: 0,
          bottom: 0,
          width: '50%',
          height: 172,
          min: 0,
          max: 100,
          minSize: '0%',
          maxSize: '100%',
          sort: 'descending',
          gap: 0,
          label: {
            show: true,
            verticalAlign: 'top',
            position: 'inside',
            formatter: '{c}%',
            fontFamily: 'Lato',
            fontSize: 15,
            fontWeight: 'bold',
            textShadowColor: 'rgba(29,70,148,0.90)',
            textShadowBlur: 5,
            textBorderWidth: 0,
            color: '#ffffff',
            ...this._labelBackground,
          },
          labelLine: {
            show: false
          },
          itemStyle: {
            borderWidth: 0
          },
          data: []
        }
      ]
    };
  }
}
