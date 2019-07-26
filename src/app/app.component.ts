import { Component, OnInit } from '@angular/core';
import { AppService } from 'shared/services/app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor(public _appService: AppService) {
  }
  
  ngOnInit() {
    this._appService.init();
  }
}
