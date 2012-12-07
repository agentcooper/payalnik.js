var assert = require('assert'),
    fs = require('fs');

var payalnik = require('../lib/payalnik'),
    path = __dirname + '/tests/';


describe('filter return argument', function(){
  it('should notify about omitted return at top level of functional callback', function(){
    var input = fs.readFileSync(path + 'filter.js').toString();

    assert.deepEqual(payalnik(input),
      [
        ['functional_arguments', 1],
        ['functional_return', 1]
      ]
    );
  });
});


describe('top level scope variable', function(){
  it('should be "that"', function(){
    var input = fs.readFileSync(path + 'that.js').toString();

    assert.deepEqual(payalnik(input),
      [
        ['not_that', 2, [ 'self'  ]],
        ['not_that', 4, [ '_self' ]]
      ]
    );
  });
});


describe('jsdoc for function declaration', function(){
  it('signature must be correct', function(){
    var input = fs.readFileSync(path + 'jsdoc_fd.js').toString();

    assert.deepEqual(payalnik(input),
      [
        ['jsdoc', 4,  [ ['a'] ]],
        ['jsdoc', 13, [ ['b'] ]]
      ]
    );
  });
});


describe('jsdoc for function expression', function(){
  it('signature must be correct', function(){
    var input = fs.readFileSync(path + 'jsdoc_fe.js').toString();

    assert.deepEqual(payalnik(input),
      [
        [ 'jsdoc', 7, [['n', 'x', 'y']] ]
      ]
    );
  });
});


describe('bitshift operators', function(){
  it('shouldnt exist', function(){
    var input = fs.readFileSync(path + 'bitshift.js').toString();

    assert.deepEqual(payalnik(input),
      [
        [ 'bitshift', 2 ]
      ]
    );
  });
});


describe('main scope access in timed functions (setTimeout and setInterval)', function(){
  it('shouldnt exist', function(){
    var input = fs.readFileSync(path + 'setTimeout.js').toString();

    assert.deepEqual(payalnik(input),
      [
        [ 'wrong_this', 6 ],
        [ 'wrong_this', 17]
      ]
    );
  });
});


describe('typeof comparison check', function() {
  it('should work', function() {
    var input = fs.readFileSync(path + 'typeof.js').toString();

    assert.deepEqual(payalnik(input),
      [
        [ 'wrong_typeof', 3 ],
        [ 'wrong_typeof', 7 ],
        [ 'wrong_typeof', 9 ]
      ]
    );
  });
});
