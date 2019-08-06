import { Component, Input } from '@angular/core';

export interface UserMiniHighlightsGeoData {
  country_code: string;
  country: string;
  region: string;
  city: string;
}

@Component({
  selector: 'app-user-mini-highlights-geo',
  templateUrl: './geo.component.html',
  styleUrls: ['./geo.component.scss']
})
export class GeoComponent {
  @Input() data: UserMiniHighlightsGeoData = null;
}
