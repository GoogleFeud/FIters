

import {FIter} from "./FIters";

const Iterator = new FIter<number>().filter(num => num % 2 === 0).map(num => num * 2).consume().compile<[number, number[], string]>();

console.log(Iterator.toString());
console.log(Iterator([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));