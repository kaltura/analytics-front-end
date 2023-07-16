import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  KalturaClient,
  KalturaESearchHistoryAggregateFieldName,
  KalturaESearchHistoryAggregationItem,
  KalturaESearchHistoryFilter,
  KalturaESearchRange,
  SearchHistoryListAction
} from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { Configuration, OpenAIApi } from 'openai';

export type Term = {
  x: string;
  value: number
}

@Component({
  selector: 'app-search-terms',
  templateUrl: './search-terms.component.html',
  styleUrls: ['./search-terms.component.scss'],
})

export class SearchTermsComponent implements OnInit, OnDestroy {
  public _loading = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public searchTerms: Term[] = [];
  public AIResponse = 'Loading...';

  constructor(private _kalturaClient: KalturaClient,
              private _errorsManager: ErrorsManagerService) {
  }

  ngOnInit() {
    this.loadSearchTerms();
  }

  ngOnDestroy() {
  }

  private loadSearchTerms(): void {
    // this._loading = true;
    this._blockerMessage = null;

    const today = new Date().getTime();
    const twoWeeksAgo = today - 14 * 24 * 60 * 60 * 1000;

    const request = new SearchHistoryListAction({
      filter: new KalturaESearchHistoryFilter({
        timestampRange: new KalturaESearchRange({
          greaterThanOrEqual: Math.round(twoWeeksAgo / 1000)
        }),
        aggregation: new KalturaESearchHistoryAggregationItem({
          size: 100,
          fieldName: KalturaESearchHistoryAggregateFieldName.searchTerm
        })
      })
    });

    this.searchTerms = JSON.parse(`[{"x":"workday","value":403},{"x":"kaltura","value":376},{"x":"caption asr complete","value":240},{"x":"generative ai","value":210},{"x":"powtoon","value":202},{"x":"japan tech lunch session","value":145},{"x":"sesion tq:","value":123},{"x":"song","value":121},{"x":"one accenture","value":118},{"x":"self reflection","value":118},{"x":"hackerland","value":117},{"x":"gen ai","value":115},{"x":"pride","value":112},{"x":"salesforce accenture","value":111},{"x":"sap","value":104},{"x":"power bi","value":102},{"x":"tq","value":101},{"x":"synops","value":100},{"x":"townhall","value":100},{"x":"talent discussion","value":99},{"x":"abcd","value":88},{"x":"team engagement survey","value":80},{"x":"rodolfo eschenbach","value":78},{"x":"total enterprise reinvention","value":76},{"x":"cdms","value":72},{"x":"sustainability","value":65},{"x":"hacker land","value":64},{"x":"summer event","value":64},{"x":"self-reflection","value":63},{"x":"ai","value":59},{"x":"ace","value":58},{"x":"abcd reflection","value":56},{"x":"model minds","value":56},{"x":"accenture song","value":55},{"x":"rpa","value":55},{"x":"priorities","value":54},{"x":"security","value":54},{"x":"flavia picolo","value":53},{"x":"julie sweet","value":53},{"x":"performance achievement","value":53},{"x":"abap","value":52},{"x":"disability","value":51},{"x":"music","value":51},{"x":"genai","value":50},{"x":"mms","value":50},{"x":"finance in five","value":49},{"x":"quantum computing","value":46},{"x":"newsletter","value":45},{"x":"vr","value":45},{"x":"art retention","value":44},{"x":"controllership","value":43},{"x":"h&m","value":43},{"x":"cybersecurity","value":42},{"x":"excel","value":42},{"x":"salesforce","value":42},{"x":"kaltura capture","value":41},{"x":"leadership essentials","value":41},{"x":"audm","value":40},{"x":"sap mdg","value":40},{"x":"commerce","value":39},{"x":"metaverse","value":39},{"x":"mme","value":39},{"x":"myscheduling","value":39},{"x":"storytelling","value":38},{"x":"sap btp","value":37},{"x":"roro","value":36},{"x":"servicenow","value":36},{"x":"cloud first","value":35},{"x":"workday priorities","value":35},{"x":"\\"fy23\\"","value":34},{"x":"chatgpt","value":34},{"x":"#spice","value":33},{"x":"industry x","value":33},{"x":"journey","value":33},{"x":"learning to learn","value":33},{"x":"reverse","value":33},{"x":"bpo","value":32},{"x":"chat gpt","value":32},{"x":"devopsweek2023","value":32},{"x":"downstream","value":32},{"x":"tax","value":32},{"x":"e-mail","value":31},{"x":"teaser","value":31},{"x":"password reset","value":30},{"x":"people","value":30},{"x":"skills","value":30},{"x":"bcm","value":29},{"x":"databricks","value":29},{"x":"ix for","value":28},{"x":"mobilization","value":28},{"x":"code of business ethics","value":27},{"x":"health","value":27},{"x":"solution tablet","value":27},{"x":"town hall","value":27},{"x":"ux design","value":27},{"x":"celonis","value":26},{"x":"devops","value":26},{"x":"let there be change","value":26},{"x":"sap obp","value":26},{"x":"atc nantes","value":24}]`);
    const chart = window['anychart'].tagCloud();
    chart.angles([0]);
    chart.data(this.searchTerms, {mode: "spiral"});
    chart.container("wordsCloud");
    chart.draw();

    this.loadAiAnalysis();

/*
    this._kalturaClient
      .request(request)
      .pipe(
        cancelOnDestroy(this)
      )
      .subscribe(
        result => {
          this._loading = false;
          if (result?.aggregations && result?.aggregations.length && result?.aggregations[0].buckets) {
            result?.aggregations[0].buckets.forEach(bucket => {
              this.searchTerms.push({x: bucket.value, value: bucket.count});
            })
            const chart = window['anychart'].tagCloud();
            chart.angles([0]);
            chart.data(this.searchTerms, {mode: "spiral"});
            chart.container("wordsCloud");
            chart.draw();
            console.log(JSON.stringify(this.searchTerms));
          }
        },
        error => {
          this._loading = false;
          const actions = {
            'close': () => {
              this._blockerMessage = null;
            },
            'retry': () => {
              this.loadSearchTerms();
            }
          };
          this._blockerMessage = this._errorsManager.getErrorMessage(error, actions);
        });*/

  }

  private loadAiAnalysis(): void {
    const configuration = new Configuration({
        apiKey: analyticsConfig.customData.openAiKey,
      });
    const openai: OpenAIApi = new OpenAIApi(configuration);

    openai.createCompletion({
      model: "text-davinci-003",
      prompt: "how to make pizza",
      max_tokens: 256
    }).then(response => {
      this.AIResponse = response?.data?.choices[0]?.text || '';
    }).catch(error => {
      console.error(error?.response?.data?.error?.message || error);
    });

  }
}
