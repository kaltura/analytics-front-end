import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  KalturaClient,
  KalturaESearchHistoryAggregateFieldName,
  KalturaESearchHistoryAggregationItem,
  KalturaESearchHistoryFilter,
  KalturaESearchRange, KalturaReportInterval,
  SearchHistoryListAction
} from 'kaltura-ngx-client';
import { analyticsConfig } from 'configuration/analytics-config';
import { AreaBlockerMessage } from '@kaltura-ng/kaltura-ui';
import { ErrorsManagerService } from 'shared/services';
import { cancelOnDestroy } from '@kaltura-ng/kaltura-common';
import { Configuration, OpenAIApi } from 'openai';
import {SelectItem} from "primeng/api";

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
  public _searchTermsLoaded = false;
  public _aiLoading = false;
  public _blockerMessage: AreaBlockerMessage = null;
  public searchTerms: Term[] = [];
  public AIResponse = 'Analyzing...';
  public _viewOptions: SelectItem[] = [
    {label: '', value: 'cloud', icon: 'icon-ic_nodes'},
    {label: '', value: 'table', icon: 'kIconList'}
  ];
  public _selectedView = 'table';
  public _showTrends = false;
  public _showTable = false;
  public _categories: {category: string, percent: number}[] = [];
  public _trends: {categoryName: string, changePercent: number, negative: boolean}[] = [];
  private _trendsLoaded = false;
  public showError = false;

  private chart: any;

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
          size: 52,
          fieldName: KalturaESearchHistoryAggregateFieldName.searchTerm
        })
      })
    });

    this.searchTerms = JSON.parse(`[{"x":"workday","value":362},{"x":"generative ai","value":225},{"x":"powtoon","value":171},{"x":"japan tech lunch session","value":144},{"x":"gen ai","value":137},{"x":"sesion tq:","value":123},{"x":"song","value":121},{"x":"self reflection","value":120},{"x":"tq","value":117},{"x":"synops","value":114},{"x":"one accenture","value":112},{"x":"salesforce accenture","value":111},{"x":"pride","value":109},{"x":"sap","value":108},{"x":"talent discussion","value":89},{"x":"cdms","value":82},{"x":"rodolfo eschenbach","value":78},{"x":"julie sweet","value":77},{"x":"power bi","value":77},{"x":"rpa","value":74},{"x":"self-reflection","value":73},{"x":"abcd","value":66},{"x":"hacker land","value":66},{"x":"summer event","value":64},{"x":"roro","value":60},{"x":"ai","value":58},{"x":"hackerland","value":56},{"x":"priorities","value":56},{"x":"mms","value":55},{"x":"ace","value":54},{"x":"rosetta stone","value":54},{"x":"security","value":54},{"x":"sustainability","value":54},{"x":"total enterprise reinvention","value":54},{"x":"flavia picolo","value":53},{"x":"salesforce","value":53},{"x":"disability","value":51},{"x":"excel","value":49},{"x":"kaltura capture","value":49},{"x":"finance in five","value":48},{"x":"servicenow","value":48},{"x":"abcd reflection","value":44},{"x":"art retention","value":44},{"x":"audm","value":44},{"x":"performance achievement","value":44},{"x":"sap btp","value":44},{"x":"h&m","value":43},{"x":"sap mdg","value":43},{"x":"cybersecurity","value":42},{"x":"myconcerto","value":42},{"x":"controllership","value":40},{"x":"townhall","value":40},{"x":"music","value":39}]`);
    this.chart = window['anychart'].tagCloud();
    this.chart.angles([0]);
    this.chart.data(this.searchTerms, {mode: "spiral"});
    this.chart.normal().fontFamily('Lato');
    let palette = window['anychart'].palettes.distinctColors();
    palette.items(
      ['#006EFA', '#41BEFF', '#FFCD00', '#FFAA00','#FA374B', '#3CD2AF', '#00A078']
    );
    this.chart.palette(palette);
    this.chart.container("wordsCloud");
    this.chart.draw();
    this._searchTermsLoaded = true;
return;
     this.loadAiAnalysis();

    this._kalturaClient
      .request(request)
      .pipe(
        cancelOnDestroy(this)
      )
      .subscribe(
        result => {
          this._loading = false;
          if (result?.aggregations && result?.aggregations.length && result?.aggregations[0].buckets) {
            result?.aggregations[0].buckets.filter(b => b.value.toLowerCase() !== 'kaltura' && b.value.toLowerCase() !== 'caption asr complete').forEach(bucket => {
              this.searchTerms.push({x: bucket.value, value: bucket.count});
            })
            this.chart = window['anychart'].tagCloud();
            this.chart.normal().fontFamily('Lato');
            this.chart.normal().fontWeight(700);
            let palette = window['anychart'].palettes.distinctColors();
            palette.items(
              ['#006EFA', '#41BEFF', '#FFAA00','#FA374B', '#3CD2AF', '#00A078']
            );
            this.chart.palette(palette);
            this.chart.textSpacing(7);
            this.chart.angles([0]);
            this.chart.data(this.searchTerms, {mode: "spiral"});
            this.chart.container("wordsCloud");
            this.chart.draw();
            this._searchTermsLoaded = true;
            this.loadAiAnalysis();
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
        });

  }

  public exportChart(): void {
    window['anychart'].exports.filename('top_search_terms');
    this.chart.saveAsPdf();
  }

  private loadAiAnalysis(): void {
    this._aiLoading = true;
    const configuration = new Configuration({
        apiKey: analyticsConfig.customData.openAiKey,
      });
    const openai: OpenAIApi = new OpenAIApi(configuration);

    let prompt = `below is a JSON array of search terms represented by the 'word' field and the number of times people searched for them represented by the 'count' field. Categorize the search terms into up to 5 categories and return a JSON array of category items. For each category set the field 'category' with the category name and the field 'count' with the total number of searches preformed on all the word items in this category.

[
  {"word": "workday", "count": 402},
  {"word": "generative ai", "count": 215},
  {"word": "powtoon", "count": 193},
  {"word": "japan tech lunch session", "count": 145},
  {"word": "self reflection", "count": 125},
  {"word": "sesion tq:", "count": 123},
  {"word": "song", "count": 121},
  {"word": "gen ai", "count": 115},
  {"word": "hackerland", "count": 113},
  {"word": "pride", "count": 112},
  {"word": "sap", "count": 106},
  {"word": "power bi", "count": 102},
  {"word": "talent discussion", "count": 102},
  {"word": "tq", "count": 101},
  {"word": "synops", "count": 100},
  {"word": "townhall", "count": 100},
  {"word": "abcd", "count": 87},
  {"word": "team engagement survey", "count": 80},
  {"word": "total enterprise reinvention", "count": 76},
  {"word": "cdms", "count": 72},
  {"word": "hacker land", "count": 72},
  {"word": "self-reflection", "count": 68},
  {"word": "sustainability", "count": 65},
  {"word": "summer event", "count": 64},
  {"word": "ai", "count": 59},
  {"word": "ace", "count": 58},
  {"word": "abcd reflection", "count": 56},
  {"word": "model minds", "count": 56},
  {"word": "rpa", "count": 55},
  {"word": "priorities", "count": 54},
  {"word": "security", "count": 54},
  {"word": "performance achievement", "count": 53},
  {"word": "abap", "count": 52},
  {"word": "disability", "count": 51},
  {"word": "music", "count": 51},
  {"word": "genai", "count": 50},
  {"word": "mms", "count": 50},
  {"word": "newsletter", "count": 45},
  {"word": "art retention", "count": 44},
  {"word": "controllership", "count": 43},
  {"word": "cybersecurity", "count": 42},
  {"word": "servicenow", "count": 42}
]`
    if (this._showTrends && !this._trendsLoaded) {
      const categories = [];
      this._categories.forEach(category => categories.push(category.category));
      prompt = `below is a JSON array of search terms represented by the 'word' field and the number of times people searched for them represented by the 'count' field. Categorize the search terms into these categories: ${categories.toString()} .return a JSON array of category items. For each category set the field 'category' with the category name and the field 'count' with the total number of searches performed on all the word items in this category.

[
  {"word": "recognition", "count": 679},
  {"word": "powtoon", "count": 281},
  {"word": "workday", "count": 215},
  {"word": "hacker land", "count": 213},
  {"word": "generative ai", "count": 180},
  {"word": "hackerland", "count": 175},
  {"word": "tq", "count": 170},
  {"word": "gen ai", "count": 148},
  {"word": "talent discussion", "count": 127},
  {"word": "excel", "count": 124},
  {"word": "pride", "count": 123},
  {"word": "sap", "count": 120},
  {"word": "salesforce", "count": 114},
  {"word": "bms", "count": 104},
  {"word": "devops on google cloud platform", "count": 102},
  {"word": "abcd", "count": 101},
  {"word": "industry x", "count": 96},
  {"word": "automation success stories", "count": 95},
  {"word": "self reflection", "count": 89},
  {"word": "sogie", "count": 89},
  {"word": "priorities", "count": 87},
  {"word": "intelligent operations", "count": 74},
  {"word": "rpa", "count": 74},
  {"word": "t&o brownbag", "count": 74},
  {"word": "agile", "count": 71},
  {"word": "powerpoint", "count": 70},
  {"word": "security", "count": 70},
  {"word": "performance achievement", "count": 68},
  {"word": "wealth creation", "count": 66},
  {"word": "innovation", "count": 63},
  {"word": "synops", "count": 62},
  {"word": "mod2", "count": 61},
  {"word": "mob essentials training", "count": 57},
  {"word": "passwordless", "count": 57},
  {"word": "scrum", "count": 55},
  {"word": "leadership essentials", "count": 53},
  {"word": "genai", "count": 52},
  {"word": "salesforce flash", "count": 52},
  {"word": "store operations", "count": 50},
  {"word": "power bi", "count": 49},
  {"word": "introduction", "count": 47},
  {"word": "sap production", "count": 47},
  {"word": "v360", "count": 47},
  {"word": "devopsweek2023", "count": 46}
]`;
    }
    openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 256
    }).then(response => {
      this.AIResponse = response?.data?.choices[0]?.text || '';
      if (this.AIResponse.length) {
        this.parseAIResults();
      }
      this._aiLoading = false;
    }).catch(error => {
      console.error(error?.response?.data?.error?.message || error);
      this.showError = true;
      this._aiLoading = false;
    });
  }

  public handleError(): void {
    this.showError = false;
    this.loadAiAnalysis();
  }

  private parseAIResults(): void {
    if (this._showTrends) {
      this._trendsLoaded = true;
      let total = 0;
      const newCategoriesData = JSON.parse(this.AIResponse);
      const newCategories = [];
      if (newCategoriesData?.length) {
        newCategoriesData.forEach(category => {
          total += parseInt(category.count);
        })
        newCategoriesData.forEach(category => {
          newCategories.push({category: category.category, percent: Number((parseInt(category.count) / total * 100).toFixed(2))})
        })
        this._trends = [];
        newCategories.forEach(category => {
          const categoryName = category.category;
          this._categories.forEach(cat => {
            if (cat.category === categoryName) {
              const negative = cat.percent < category.percent;
              const changePercent = Math.abs(Number((cat.percent - category.percent).toFixed(2)));
              this._trends.push({categoryName, changePercent, negative});
            }
          })
        })
      }
    } else {
      this._categories = [];
      let total = 0;
      let categoriesData = JSON.parse(this.AIResponse);
      if (categoriesData?.length) {
        categoriesData.forEach(category => {
          total += parseInt(category.count);
        })
        categoriesData.forEach(category => {
          this._categories.push({category: category.category, percent: Number((parseInt(category.count) / total * 100).toFixed(2))})
        })
      }
    }
  }

  public showTrends(show:boolean): void {
    this._showTrends = show;
    if (show && !this._trendsLoaded) {
      this.loadAiAnalysis();
    }
  }

}
