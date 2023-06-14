import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-ep-reactions',
  templateUrl: './reactions.component.html',
  styleUrls: ['./reactions.component.scss']
})
export class ReactionsComponent implements OnInit{
  @Input() reportData: any[] = [];
  @Input() exporting = false;

  private _reactions: { totalClicks: number, topReaction: string, positionPercent: string }[] = [];
  public _topReactions: { totalClicks: number, topReaction: string, positionPercent: string }[] = [];

  constructor() {}

  ngOnInit(): void {
    this.createReactionsData();
    this.setTopReactions();
  }

  createReactionsData(): void {
    if (this.reportData.length < 21) {
      // since we have up to 20 items - we don't need to group and average the data to 20 items and can continue with calculations
      this.calculateMaxReactions(this.reportData);
    } else {
      // we have more than 20 items - we will group and average the data to up to 20 items (could be 10-20 items according to the data length)
      // the chunkArray function below splits the original array to an array of arrays according to the defined size parameter
      const chunkArray = (arr, size) =>  arr.length > size ? [arr.slice(0, size), ...chunkArray(arr.slice(size), size)] : [arr];
      const size = Math.ceil(this.reportData.length / 20); // divide the array length to 20 and round up so we get up to 20 items (maybe less)
      const splitArray = chunkArray(this.reportData, size); // create array of arrays. Each small array length equal to size
      let averagedArray = []; // array holding the groups averages
      splitArray.forEach(items => {
        let sumClicks = [0,0,0,0,0];
        // go through the items in the inner array
        items.forEach(item => {
          // sum up all reaction clicks
          ['reaction_clap_clicked','reaction_heart_clicked','reaction_think_clicked','reaction_wow_clicked','reaction_smile_clicked'].forEach((reaction, index) => {
            sumClicks[index] += parseInt(item[reaction]);
          });
        });
        // add the grouped data to the average array
        averagedArray.push({
          'reaction_clap_clicked': sumClicks[0],
          'reaction_heart_clicked': sumClicks[1],
          'reaction_think_clicked': sumClicks[2],
          'reaction_wow_clicked': sumClicks[3],
          'reaction_smile_clicked': sumClicks[4]
        })
      });
      this.calculateMaxReactions(averagedArray);
    }
  }

  calculateMaxReactions (array: any[]): void  {
    // For each item calculate total clicks and which reaction was used the most + position
    const interval = 100 / array.length;
    array.forEach((item, index) => {
      let maxClicks = -1;
      let totalClicks = 0;
      let topReaction = '';
      ['reaction_clap_clicked','reaction_heart_clicked','reaction_think_clicked','reaction_wow_clicked','reaction_smile_clicked'].forEach(reaction => {
        const reactionClicks = parseInt(item[reaction]);
        totalClicks += reactionClicks;
        if (reactionClicks > maxClicks) {
          maxClicks = reactionClicks;
          topReaction = reaction;
        }
      })
      // to define the absolute position we calculate the left positioning in percentage and reduce 20px which is half the reaction icon size in order to center it
      const position = index * interval + interval / 2;
      this._reactions.push({
        totalClicks,
        topReaction,
        positionPercent: `calc(${position}% - 20px`
      });
    });
  }

  setTopReactions(): void {
    // set the top 5 reactions in the top reactions array rendered on the graph
    this._reactions.forEach(reaction => {
      if (reaction.totalClicks > 0) {
        // gather all reactions that were used (clicks are larger than 0)
        this._topReactions.push(reaction);
      }
      // sort according to totalClicks descending
      this._topReactions.sort((a, b) => {
        if ( a.totalClicks < b.totalClicks ){
          return 1;
        }
        if ( a.totalClicks > b.totalClicks ){
          return -1;
        }
        return 0;
      })
      // cut the array to 5 if larger than that
      if (this._topReactions.length > 5) {
        this._topReactions.length = 5;
      }
    })
  }
}
