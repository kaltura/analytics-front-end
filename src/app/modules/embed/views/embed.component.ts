import { Component, OnInit } from '@angular/core';
import { AuthService } from "shared/services";

@Component({
  selector: 'app-embed',
  templateUrl: './embed.component.html',
  styleUrls: ['./embed.component.scss']
})
export class EmbedComponent implements OnInit {
  
  constructor(private _authService: AuthService) {
  }
  
  ngOnInit(): void {
    const data = {
      pid: this._authService.pid,
      ks: this._authService.ks
    };
    window.localStorage.setItem('kData', JSON.stringify(data));
  }
  
  public copyLink(text: string): boolean {
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
    return copied;
  }
  
}
