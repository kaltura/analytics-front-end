import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {KalturaClient, PartnerGetInfoAction} from "kaltura-ngx-client";

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {

  public partnerName = '';

  constructor(
    private _router: Router,
    private _kalturaServerClient: KalturaClient) {

  }

  public start(): void {
    this._router.navigate(['/audience/engagement/']);
  }

  ngOnInit(): void {
    this._kalturaServerClient.request(new PartnerGetInfoAction()).subscribe(
      partner => this.partnerName = partner.name
    )
  }
}
