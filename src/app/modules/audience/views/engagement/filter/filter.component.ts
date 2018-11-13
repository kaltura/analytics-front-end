import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.scss']
})
export class FilterComponent implements OnInit {


  @Output() filterChange: EventEmitter<{}> = new EventEmitter();

  constructor(private _translate: TranslateService) {
  }

  ngOnInit() {

  }


}
