import { Component, OnInit } from '@angular/core';
import {AuthService, BrowserService} from "shared/services";

export interface GrowlMessage {
  severity: 'success' | 'info' | 'error' | 'warn';
  summary?: string;
  detail?: string;
}

@Component({
  selector: 'app-embed',
  templateUrl: './embed.component.html',
  styleUrls: ['./embed.component.scss']
})
export class EmbedComponent implements OnInit {
  
  public entryId = '';
  
  public partnerLinks = [
    {
      label: 'Partner Engagement Report',
      entryId: -1,
      code: 'https://il-kmc-ng.dev.kaltura.com/hack20/apps/analytics-v1.12.1/views/engagement.html'
    },
    {
      label: 'Entry Performance',
      entryId: '',
      code: 'https://il-kmc-ng.dev.kaltura.com/hack20/apps/analytics-v1.12.1/views/entry.html?id='
    }
  ];
  
  constructor(
    private _authService: AuthService,
    private _browserService: BrowserService) {
  }
  
  ngOnInit(): void {
    const data = {
      pid: this._authService.pid,
      ks: this._authService.ks
    };
    window.localStorage.setItem('kData', JSON.stringify(data));
  }
  
  public copyLink(link: any): boolean {
    const text = link.entryId === -1 ? link.code : link.code + link.entryId;
    let copied = false;
    let textArea = document.createElement("textarea");
    textArea.style.position = 'fixed';
    textArea.style.top = -1000 + 'px';
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      copied = document.execCommand('copy');
    } catch (err) {
      console.log('Copy to clipboard operation failed');
    }
    document.body.removeChild(textArea);
    if (copied) {
      this._browserService.showGrowlMessage({severity: 'success', detail: "Copied to clipboard"});
    }
    return copied;
  }

  
}
