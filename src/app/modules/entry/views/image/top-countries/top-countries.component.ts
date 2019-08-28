import { Component } from '@angular/core';
import { ReportService } from 'shared/services';
import { ImageTopCountriesConfig } from './top-countries.config';
import { TopCountriesComponent } from '../../shared/top-countries/top-countries.component';
import { TopCountriesConfig } from '../../shared/top-countries/top-countries.config';

@Component({
  selector: 'app-image-top-countries',
  templateUrl: '../../shared/top-countries/top-countries.component.html',
  styleUrls: ['../../shared/top-countries/top-countries.component.scss'],
  providers: [{ provide: TopCountriesConfig, useClass: ImageTopCountriesConfig }, ReportService]
})
export class ImageTopCountriesComponent extends TopCountriesComponent {
  // public _distributionKey = 'loads_distribution';
  // public _distributionCalculationKey = 'count_loads';
  // TODO update once the server supports impressions
  public _distributionKey = 'plays_distribution';
  public _distributionCalculationKey = 'count_plays';
}
