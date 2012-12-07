module.exports = function(payalnik) {
  'use strict';

  var logError = payalnik.logError;

  var TYPES = {
    'string': 1,
    'number': 1,
    'function': 1,
    'null': 1,
    'boolean': 1,
    'object': 1
  };

  var EQUALITY_OPS = {
    "==": 1,
    "===": 1,
    '!=': 1,
    '!==': 1
  };

  function check(node) {
    if (node.type === "IfStatement") {
      if (node.test && node.test.type === "BinaryExpression") {
        var test = node.test;
        if (EQUALITY_OPS[node.test.operator]) {
          if (test.left.operator === "typeof") {

            if (test.right.type === "Identifier") {
              if (test.right.name === "undefined") {
                logError(node, 'wrong_typeof');
              }
            }

            if (test.right.type === "Literal") {
              if (!TYPES[test.right.value]) {
                logError(node, 'wrong_typeof');
              }
            }
          }
        }
      }
    }
  }

  return check;
};
