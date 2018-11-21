import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import {ReportDataConfig, ReportDataSection, ReportDataBaseConfig} from 'shared/services/storage-data-base.config';
import {ReportHelper} from 'shared/services';
import {EChartOption} from 'echarts';

@Injectable()
export class GeoLocationDataConfig extends ReportDataBaseConfig {
  constructor(_translate: TranslateService) {
    super(_translate);
  }

  public getConfig(): ReportDataConfig {
    return {
      [ReportDataSection.table]: {
        fields: {
          'object_id': {
            format: value => value,
            nonComparable: true,
          },
          'country': {
            format: value => value,
            nonComparable: true,
          },
          'count_plays': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrNA(value)
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value)
          }
        }
      },
      [ReportDataSection.totals]: {
        units: '',
        preSelected: 'count_plays',
        fields: {
          'count_plays': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.audience.geo.count_plays`),
            tooltip: this._translate.instant(`app.audience.geo.count_plays_tt`),
          },
          'unique_known_users': {
            format: value => ReportHelper.numberOrNA(value),
            title: this._translate.instant(`app.audience.geo.unique_known_users`),
            tooltip: this._translate.instant(`app.audience.geo.unique_known_users_tt`),
          },
          'avg_view_drop_off': {
            format: value => ReportHelper.percents(value),
            title: this._translate.instant(`app.audience.geo.avg_view_drop_off`),
            tooltip: this._translate.instant(`app.audience.geo.avg_view_drop_off_tt`),
          }
        }
      }
    };
  }

  public getMapConfig(): EChartOption {
    return {
      textStyle: {
        fontFamily: 'Lato',
      },
      grid: {
        top: 24, left: 24, bottom: 24, right: 24, containLabel: true
      },
      tooltip: {
        trigger: 'item',
        backgroundColor: '#ffffff',
        borderColor: '#dadada',
        borderWidth: 1,
        extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
        textStyle: {
          color: '#999999'
        },
        formatter: (params) => {
          if (params.name && parseFloat(params.value) >= 0) {
            let tooltip = params.seriesName + '<br/>' + params.name + ' : ' + params.value;
            if (params.seriesName === 'Avg. Drop Off') {
              tooltip = tooltip + '%';
            }
            return tooltip;
          } else {
            return this._translate.instant('app.common.na');
          }
        }
      },
      visualMap: {
        min: 0,
        max: 1000000,
        left: 16,
        realtime: false,
        calculable: true,
        inRange: {
          color: ['#B4E9FF', '#2541B8']
        }
      },
      series: [
        {
          name: '',
          type: 'map',
          mapType: 'world',
          roam: false,
          zoom: 1.2,
          selectedMode: 'single',
          animationDurationUpdate: 200,
          animationEasingUpdate: 'cubicInOut',
          itemStyle: {
            areaColor: '#ebebeb',
            borderColor: '#999999',
            emphasis: {label: {show: true}, areaColor: '#F49616'}
          },
          data: []
        }
      ]
    };
  }

  public getCountryName(country: string): string {
    // map kaltura server country names to gep map county names
    const serveCountryNames = ["ALAND ISLANDS",
      "ANTIGUA AND BARBUDA",
      "BOLIVIA, PLURINATIONAL STATE OF",
      "BOSNIA AND HERZEGOVINA",
      "BRITISH INDIAN OCEAN TERRITORY",
      "BRUNEI DARUSSALAM",
      "CAYMAN ISLANDS",
      "CENTRAL AFRICAN REPUBLIC",
      "CZECH REPUBLIC",
      "DOMINICAN REPUBLIC",
      "EQUATORIAL GUINEA",
      "FALKLAND ISLANDS (MALVINAS)",
      "FAROE ISLANDS",
      "FRENCH POLYNESIA",
      "FRENCH SOUTHERN TERRITORIES",
      "HEARD ISLAND AND MCDONALD ISLANDS",
      "IRAN, ISLAMIC REPUBLIC OF",
      "KOREA, DEMOCRATIC PEOPLE'S REPUBLIC OF",
      "KOREA, REPUBLIC OF",
      "LAO PEOPLE'S DEMOCRATIC REPUBLIC",
      "LIBYAN ARAB JAMAHIRIYA",
      "MACEDONIA, THE FORMER YUGOSLAV REPUBLIC OF",
      "MICRONESIA, FEDERATED STATES OF",
      "MOLDOVA, REPUBLIC OF",
      "RUSSIAN FEDERATION",
      "SAINT PIERRE AND MIQUELON",
      "SAINT VINCENT AND THE GRENADINES",
      "SAO TOME AND PRINCIPE",
      "SERBIA AND MONTENEGRO",
      "SOLOMON ISLANDS",
      "SYRIAN ARAB REPUBLIC",
      "TANZANIA, UNITED REPUBLIC OF",
      "TURKS AND CAICOS ISLANDS",
      "UNITED STATES MINOR OUTLYING ISLANDS",
      "VENEZUELA, BOLIVARIAN REPUBLIC OF",
      "VIET NAM"];
    const mapCountryNames = ["Aland",
      "Antigua and Barb.",
      "Bolivia",
      "Bosnia and Herz.",
      "Br. Indian Ocean Ter.",
      "Brunei",
      "Cayman Is.",
      "Central African Rep.",
      "Czech Rep.",
      "Dominican Rep.",
      "Eq. Guinea",
      "Falkland Is.",
      "Faeroe Is.",
      "Fr. Polynesia",
      "Fr. S. Antarctic Lands",
      "Heard I. and McDonald Is.",
      "Iran",
      "Korea",
      "Korea",
      "Lao PDR",
      "Libya",
      "Macedonia",
      "Micronesia",
      "Moldova",
      "Russia",
      "St. Pierre and Miquelon",
      "St. Vin. and Gren.",
      "São Tomé and Principe",
      "Serbia",
      "Solomon Is.",
      "Syria",
      "Tanzania",
      "Turks and Caicos Is.",
      "United States",
      "Venezuela",
      "Vietnam"];
    const index = serveCountryNames.indexOf(country.toUpperCase());
    return index === -1 ? country : mapCountryNames[index];
  }
}
