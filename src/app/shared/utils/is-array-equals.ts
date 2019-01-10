/**
 * Works only for non-nested arrays (e.g. string[], number[], etc)
 * If one of the arguments is not an array returns false
 *
 * @param {Array} array1
 * @param {Array} array2
 * @return {Boolean}
 */
export function isArrayEquals(array1: any[], array2: any[]): boolean {
  if (!Array.isArray(array1) || !Array.isArray(array2)) {
    return false;
  }

  array1.sort();
  array2.sort();
  
  return array1.length === array2.length && array1.every((value, index) => value === array2[index]);
}
