## Payalnik.js

Payalnik.js is an aggressive javascript static analysis tool.

Availablle checks:

* `return` when inside `filter`, `map` or similar, also arguments for an anonymous function passed to them

* jsdoc signature for function declaration and function expression

* global selectors when inside jquery widget constructor

and some others.

### Tests

Run `mocha` (you should probably install it first).

### Credits

Powered by [Esprima](https://github.com/ariya/esprima).
