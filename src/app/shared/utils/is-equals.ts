/**
 * @param {any} value1
 * @param {any} value2
 * @return {Boolean}
 */
export function isEqual(value1: any, value2: any): boolean {
  
  // Get the value type
  const type = Object.prototype.toString.call(value1);
  
  // If the two objects are not the same type, return false
  if (type !== Object.prototype.toString.call(value2)) {
    return false;
  }
  
  // If items are not an object or array, return false
  if (['[object Array]', '[object Object]'].indexOf(type) < 0) {
    return false;
  }
  
  // Compare the length of the length of the two items
  const valueLen = type === '[object Array]' ? value1.length : Object.keys(value1).length;
  const otherLen = type === '[object Array]' ? value2.length : Object.keys(value2).length;
  if (valueLen !== otherLen) {
    return false;
  }
  
  // Compare two items
  const compare = (item1, item2) => {
    
    // Get the object type
    const itemType = Object.prototype.toString.call(item1);
    
    // If an object or array, compare recursively
    if (['[object Array]', '[object Object]'].indexOf(itemType) >= 0) {
      if (!isEqual(item1, item2)) {
        return false;
      }
    } else {
      
      // If the two items are not the same type, return false
      if (itemType !== Object.prototype.toString.call(item2)) {
        return false;
      }
      
      // Else if it's a function, convert to a string and compare
      // Otherwise, just compare
      if (itemType === '[object Function]') {
        if (item1.toString() !== item2.toString()) {
          return false;
        }
      } else {
        if (item1 !== item2) {
          return false;
        }
      }
      
    }
  };
  
  // Compare properties
  if (type === '[object Array]') {
    for (let i = 0; i < valueLen; i++) {
      if (compare(value1[i], value2[i]) === false) {
        return false;
      }
    }
  } else {
    for (let key in value1) {
      if (value1.hasOwnProperty(key)) {
        if (compare(value1[key], value2[key]) === false) {
          return false;
        }
      }
    }
  }
  
  // If nothing failed, return true
  return true;
}
