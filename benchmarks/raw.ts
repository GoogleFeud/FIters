
import {FIter} from "../src/FIters";
import {performance} from "perf_hooks";

const data: number[] = [];
for (let i=0; i < 10000; i++) {
    data.push(i);
}

const Iterator = new FIter<number>().filter(num => num % 2 === 0).map(num => num * 2).join("\\n").compile();

let FIterBefore = performance.now();
for (let i=0; i < 10000; i++) {
    Iterator(data);
}
console.log(`FIters#filter#map#join => ${performance.now() - FIterBefore}ms`);

let RegBefore = performance.now();
for (let i=0; i < 10000; i++) {
    data.filter(num => num % 2 === 0).map(num => num * 2).join("\n");
}
console.log(`Array#filter#map#join => ${performance.now() - RegBefore}ms`);

const ReduceIterator = new FIter<number>().filter(num => num % 2 !== 0).reduce((acc, num) => acc + num, 0).compile();
let FIterReduceBefore = performance.now();

for (let i=0; i < 10000; i++) {
    ReduceIterator(data);
}
console.log(`FIters#filter#reduce => ${performance.now() - FIterReduceBefore}ms`);

let RegReduceBefore = performance.now();
for (let i=0; i < 10000; i++) {
    data.filter(num => num % 2 !== 0).reduce((acc, num) => acc + num, 0);
}
console.log(`Array#filter#reduce => ${performance.now() - RegReduceBefore}ms`);