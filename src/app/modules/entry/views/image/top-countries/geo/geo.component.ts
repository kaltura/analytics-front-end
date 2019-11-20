import { Component, Input } from '@angular/core';
import { GeoComponent } from '../../../shared/top-countries/geo/geo.component';

@Component({
  selector: 'app-image-entry-geo',
  templateUrl: '../../../shared/top-countries/geo/geo.component.html',
  styleUrls: ['../../../shared/top-countries/geo/geo.component.scss'],
})
export class ImageGeoComponent extends GeoComponent {
  @Input() selectedMetrics = 'count_loads';
  @Input() distributionCalculationKey = 'count_loads';
  @Input() distributionKey = 'loads_distribution';
}
