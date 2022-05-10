import {Component, Input, AfterViewInit, OnDestroy} from '@angular/core';

@Component({
    selector: 'app-k-player-v7',
    templateUrl: './player-v7.component.html',
	styleUrls: ['./player-v7.component.scss']
})
export class KalturaPlayerV7Component implements AfterViewInit, OnDestroy {

	@Input()
	width = 480;

	@Input()
	height = 360;

	@Input()
	pid: string;

	@Input()
	uiconfid: number;

	@Input()
	entryid: string;

	@Input()
	ks: string;

	@Input()
	cdnUrl: string;

	@Input()
	autoPlay = false;

	@Input()
	muted = false;

	@Input()
	id = "";

  @Input()
  poster = '';

  @Input()
  loadThumbnailWithKs = false;

	constructor() {
	  if (!this.id.length) {
	    this.id = Math.random().toString().split('.')[1];
    }
  }

	ngAfterViewInit() {
	  this.Embed();
	}

	public Embed(): void {
		// validation
		if (!this.pid || !this.uiconfid || !this.entryid) {
			console.warn("Kaltura Player V7::Missing parameters. Please provide pid, uiconfid and entryid.");
		} else {
			// load player lib if doesn't exist
			if (document.getElementById("kalturaPlayerV7Lib") === null) {
				let s = document.createElement('script');
				s.src = `${this.cdnUrl}/p/${this.pid}/embedPlaykitJs/uiconf_id/${this.uiconfid}/ks/${this.ks}`;
				s.id = "kalturaPlayerV7Lib";
				s.async = false;
				document.head.appendChild(s);
			}
			// wait for lib to load if not loaded and then embed player
      if (typeof window['KalturaPlayer'] === "undefined") {
				const intervalID = setInterval(() => {
					if (typeof window['KalturaPlayer'] !== "undefined") {
						clearInterval(intervalID);
						this.doEmbed();
					}
				}, 50);
			} else {
				this.doEmbed();
			}
		}
	}

	private doEmbed(): void {
    try {
      let playerConfig = {
        targetId: "kaltura_player_" + this.id,
        plugins: {
          kava: {
            disable: true
          }
        },
        provider: {
          ks: this.ks,
          partnerId: this.pid,
          uiConfId: this.uiconfid
        },
        playback: {
          autoplay: this.autoPlay,
          muted: this.muted
        }
      };
      if (this.loadThumbnailWithKs && this.poster.length) {
        playerConfig = Object.assign(playerConfig, {sources: {poster: `${this.poster}/ks/${this.ks}`}});
      }
      const kalturaPlayer = window["KalturaPlayer"].setup(playerConfig);
      kalturaPlayer.loadMedia({entryId: this.entryid});
    } catch (e) {
      console.error(e.message);
    }
	}

  ngOnDestroy(): void {
	  // remove player lib from head on destroy
	  const script = document.getElementById("kalturaPlayerV7Lib");
    if (script !== null) {
      script.parentNode.removeChild(script);
    }
  }

}

