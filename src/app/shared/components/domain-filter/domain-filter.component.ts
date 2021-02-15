import { Component, EventEmitter, Input, IterableChangeRecord, IterableDiffer, IterableDiffers, OnDestroy, Output } from '@angular/core';
import { DateChangeEvent } from 'shared/components/date-filter/date-filter.service';
import { DomainsFilterService } from './domains-filter.service';

export interface DomainFilterValueItem {
  name: string;
  id: string;
}

@Component({
  selector: 'app-domain-filter',
  templateUrl: './domain-filter.component.html',
  styleUrls: ['./domain-filter.component.scss']
})
export class DomainFilterComponent implements OnDestroy {
  @Input() set selectedFilters(value: DomainFilterValueItem[]) {
    if (Array.isArray(value) && value.length) {
      this._selectedDomains = value;
      this._setDiffer();
    } else {
      this._selectedDomains = [];
    }
  }

  @Input() set dateFilter(event: DateChangeEvent) {
    this._domainsFilterService.updateDateFilter(event, () => {
      this._selectedDomains = [];
    });
  }

  @Output() itemSelected = new EventEmitter<DomainFilterValueItem>();
  @Output() itemUnselected = new EventEmitter<DomainFilterValueItem>();

  private _listDiffer: IterableDiffer<any>;

  public _selectedDomains: DomainFilterValueItem[];

  constructor(private _listDiffers: IterableDiffers,
              public _domainsFilterService: DomainsFilterService) {
    this._setDiffer();
  }

  ngOnDestroy() {

  }

  private _setDiffer(): void {
    this._listDiffer = this._listDiffers.find([]).create();
    this._listDiffer.diff(this._selectedDomains);
  }

  public _onItemSelected(items: { id: string, name: string }[], type: string): void {
    if (type !== 'domain') {
      return;
    }

    this._selectedDomains = items;

    const changes = this._listDiffer.diff(items);

    if (changes) {
      changes.forEachAddedItem((record: IterableChangeRecord<any>) => {
        this.itemSelected.emit(record.item);
      });

      changes.forEachRemovedItem((record: IterableChangeRecord<any>) => {
        this.itemUnselected.emit(record.item);
      });
    }
  }
}
