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
      code: document.location.href.replace('embed', 'views/engagement.html')
    },
    {
      label: 'Partner Devices Report',
      entryId: -1,
      code: document.location.href.replace('embed', 'views/devices.html')
    },
    {
      label: 'Partner Domains Report',
      entryId: -1,
      code: document.location.href.replace('embed', 'views/domains.html')
    },
    {
      label: 'Entry Summary',
      entryId: '',
      code: document.location.href.replace('embed', 'views/entry-totals.html?id=')
    },
    {
      label: 'Entry Performance',
      entryId: '',
      code: document.location.href.replace('embed', 'views/entry.html?id=')
    }
  ];
  public globalLinks = [
    {
      label: 'Global Geo Report',
      entryId: -1,
      code: document.location.href.replace('embed', 'views/global-geo.html')
    },
    {
      label: 'Global Engagement Report',
      entryId: -1,
      code: document.location.href.replace('embed', 'views/global-engagement.html')
    },
    {
      label: 'Global Storage Report',
      entryId: -1,
      code: document.location.href.replace('embed', 'views/global-storage.html')
    },
    {
      label: 'Global Domains Report',
      entryId: -1,
      code: document.location.href.replace('embed', 'views/global-domains.html')
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
