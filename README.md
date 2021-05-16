# FIters

`FIters` is an experimental javascript library, which is meant to make using array methods like `map`, `filter`, `reduce`, `join` faster, with 0 dependencies.

**FIters will always be faster than using the default array implementations. The function returned by the `compile` method has an O(n) time complexity and a constant factor of 1. The `compile` function itself is not cheap, so make sure all calls to `compile` are not in loops/functions.**

## A taste

### filter, map and join

Check out the benchmarks for these snippets using `npm run bench` and `npm run bench_raw`. FIters are approximately 1.5 times faster.

#### FIters

```ts
const Iterator = new FIter<number>().filter(num => num % 2 === 0).map(num => num * 2).join("-").compile();

Iterator([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
// 2-4-6-8
```

#### Regular Arrays

```ts
[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(num => num % 2 === 0).map(num => num * 2).join("-");
// 2-4-6-8
```

### filter, reduce

Check out the benchmarks for these snippets using `npm run bench` and `npm run bench_raw`. FIters are **much** faster.

#### FIters

```ts
const filterReduceNums = new FIter<number>().filter(num => num % 2 !== 0).reduce((acc, num) => acc + num, 0).compile();

filterReduceNums([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
// 25
```

#### Regular Arrays

```ts
[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter(num => num % 2 !== 0).reduce((acc, num) => acc + num, 0);
// 25
```

### New arrays

`filter` and `map` do NOT create new arrays. To actually get a new array from these functions, you can use the `consume` method after them:

```ts
const filterNums = new FIter<number>().filter(num => num % 2 === 0).consume().compile();
```

`FIters` also implements the `count` function, which can be used along with `filter`. It should be as fast as using the default filter implementation and the `length` property, but with a smaller memory footprint.

```ts
const filterAndCount = new FIter<number>().filter(num => num % 2 === 0).count().compile();

filterAndCount([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
// 5
```

### Returning multiple values

```ts
const Iterator = new FIter<number>().filter(num => num % 2 === 0).count().map(num => num * 2).consume().join("-").compile();

Iterator([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
// Returns [5, [4, 8, 12, 16, 20], '4-8-12-16-20']
```

```ts
const Iterator = new FIter<number>()
.filter(num => num % 2 === 0)
.min()
.max()
.map(num => (num * 2).toString(2))
.groupBy(binary => binary.length)
.join(", ")
.first(false)
.compile()

// Returns
[
  2,
  10,
  {
    '3': [ '100' ],
    '4': [ '1000', '1100' ],
    '5': [ '10000', '10100' ]
  },
  '100, 1000, 1100, 10000, 10100',
  '100'
]
```


## Some limitations

### No variables outside of the scope

With the default implementations you can use variables outside of the callback functions just fine, but this is not allowed in `FIters`:

```ts
const value = 5;
const iter = new FIter<number>().filter(num => num % value === 0).consume().compile();
iter([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]); // value is not defined
```

You'll need to tell the compile function that "value" is an outer variable, and you'll have to provide the actual value in the `iter` function itself:

```ts
const value = 5;
const iter = new FIter<number>().filter(num => num % value === 0).consume().compile("value");
iter([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], value); // [5, 10]
```

### Single-expression arrow functions are recommended

You can pass a function in any way you want:

```js
.method(function(num) { /* code */ });
.method(() => { /* code */ });
.method(() => /* code */);
```

But it's highly recommended to pass only a single-expression arrow functions (`() => ...`) because those can be easily **inlined**, which means one less function call. The current function parser can only inline those. 

You can execute multiple expressions in a single-expression arrow function like this:

```
() => (1 + 1, 2 + 2, 3 + 3)
```

The return value of the function will be `6`.

### Security

You should NOT pass functions / strings that could possibly be unsafe / taken from an external source. 

## How does this work?

When the `compile` function gets called, all the methods (`map`, `filter`, `reduce`, etc) get put in a single loop, and "compiled" via the `Function` constructor. The library also does a fair amount of optimizations. 

The library also parses the functions you provide to the methods and tries to inline them, extracting the expression from the function and replacing all parameter names.