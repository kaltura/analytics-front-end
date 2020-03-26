import { Component, Input } from '@angular/core';

export interface SubcategoryDetailsOverlayData {
  object_id: string;
  name: string;
  parent_name: string;
  direct_sub_categories_count: number;
  entries_count: number;
}

@Component({
  selector: 'app-subcategory-details-overlay',
  templateUrl: './subcategory-details-overlay.component.html',
  styleUrls: ['./subcategory-details-overlay.component.scss'],
})
export class SubcategoryDetailsOverlayComponent {
  @Input() subcategoryData: SubcategoryDetailsOverlayData;
}
