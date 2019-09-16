/*
* @link https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_groupby
*/
export function groupBy(arr: any[], key: string): any[] {
  return arr.reduce((r, v, i, a, k = v[key]) => ((r[k] || (r[k] = [])).push(v), r), {});
}
