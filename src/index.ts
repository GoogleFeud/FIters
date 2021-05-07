

import {FIter} from "./FIters";

const Iterator = new FIter<number>().filter(num => num % 2 !== 0).reduce((acc, num) => acc + num, 0).compile();

console.log(Iterator.toString());
console.log(Iterator([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));