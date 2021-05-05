

import {FIter} from "./FIters";

const value = 5;
const iter = new FIter<number>().filter(num => num % value === 0).consume().compile("value");
console.log(iter([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5));