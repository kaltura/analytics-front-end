import { Component, OnInit } from '@angular/core';
import { EngagementBaseReportComponent } from '../engagement-base-report/engagement-base-report.component';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService, ReportService } from 'shared/services';
import { CompareService } from 'shared/services/compare.service';
import { KalturaReportType } from 'kaltura-ngx-client';
import {SelectItem} from "primeng/api";

@Component({
  selector: 'app-engagement-impressions',
  templateUrl: './impressions.component.html',
  styleUrls: ['./impressions.component.scss']
})
export class EngagementImpressionsComponent extends EngagementBaseReportComponent implements OnInit {

  public _isBusy: boolean;
  public _blockerMessage: AreaBlockerMessage = null;
  public _playthroughs: SelectItem[] = [{label: '25%', value: 25}, {label: '50%', value: 50}, {label: '75%', value: 75}, {label: '100%', value: 100}];
  public _selectedPlaythrough: SelectItem = {label: '25%', value: 25};
  public _chartData = {
    tooltip: {
      trigger: 'item',
      formatter: "{a} <br/>{b} : {c}%"
    },
    color: ['#00745C', '#008569', '#00A784'],
    calculable: true,
    series: [
      {
        name:'Player Impressions',
        type:'funnel',
        left: '35%',
        top: 10,
        bottom: 10,
        width: '60%',
        height: 340,
        min: 0,
        max: 100,
        minSize: '5%',
        maxSize: '100%',
        sort: 'descending',
        gap: 0,
        label: {
          show: true,
          verticalAlign: 'top',
          position: 'inside',
          formatter: "{c}%",
          fontFamily: 'Lato',
          fontSize: 15,
          fontWeight: 'bold'
        },
        labelLine: {
          show: false
        },
        itemStyle: {
          borderWidth: 0
        },
        data: [
          {value: 20, name: 'Playthrough'},
          {value: 80, name: 'Plays'},
          {value: 100, name: 'Impressions'}
        ]
      }
    ]
  };

  constructor(private _errorsManager: ErrorsManagerService,
              private _reportService: ReportService,
              private _compareService: CompareService) {
    super();
  }

  private _reportType: KalturaReportType = KalturaReportType.contentDropoff;

  ngOnInit() {
    this._isBusy = false;
  }
  
  protected _loadReport(): void {
    console.log('EngagementImpressionsComponent - loadReport');
  }

}
