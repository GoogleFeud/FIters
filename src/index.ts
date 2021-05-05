

import {FIter} from "./FIters";

const myIter = new FIter<number>().filter(v => v % 2 === 0).forEach(val => console.log("Value: ", val)).map("val => val * n").compile("n");


console.log(myIter([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5));

