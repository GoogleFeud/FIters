
import Benchmark from "benchmark";
import {FIter} from "../src/FIters";

const data: number[] = [];
for (let i=0; i < 10000; i++) {
    data.push(i);
}

const Iterator = new FIter<number>().filter(num => num % 2 === 0).map(num => num * 2).join("\\n").compile();

const suite = new Benchmark.Suite();

suite.add('FIters#filter#map#join', () => {
  Iterator(data);
});


suite.add('for loop', () => {
  let res = "";
  const len = data.length;
  for (let i=0; i < len; i++) {
      const item = data[i];
      if (!(item % 2 === 0)) continue;
      res += item + (i === len - 1 ? '':`\n`);
  }
})
 
suite.add("only reduce", () => {
  const len = data.length;
  data.reduce((acc, item, i) => {
    if (item % 2 === 0) {
      acc += item + (i === len - 1 ? '' : '\n');
    }
    return acc;
  }, '');
})

suite.add('Array#filter#map#join', () => {
  data.filter(num => num % 2 === 0).map(num => num * 2).join("\n");
})


suite.on('cycle', (event: Benchmark.Event) => {
  console.log(String(event.target));
});

suite.on('complete', () => {
  console.log('Fastest is ' + suite.filter('fastest').map('name'));
});

suite.run();


const filterReduce = new Benchmark.Suite();

const filterReduceNums = new FIter<number>().filter(num => num % 2 !== 0).reduce((acc, num) => acc + num, 0).compile();

filterReduce.add("for loop", () => {
    let acc = 0;
    const len = data.length;
    for (let i=0; i < len; i++) {
        const item = data[i];
        if (item % 2 !== 0) acc += item;
    }
});

filterReduce.add("FIters#filter#reduce", () => {
    filterReduceNums(data);
});


filterReduce.add("reduce only", () => {
  data.reduce((acc, num) => {
      if (num % 2 !== 0) acc += num;
      return acc;
  }, 0)
});


filterReduce.on('cycle', (event: Benchmark.Event) => {
    console.log(String(event.target));
  });
  
  filterReduce.on('complete', () => {
    console.log('Fastest is ' + filterReduce.filter('fastest').map('name'));
});
  
filterReduce.run();