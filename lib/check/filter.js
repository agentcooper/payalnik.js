module.exports = function(payalnik) {
  'use strict';

  var logError = payalnik.logError;

  var requiredReturn = {
    'map':         1,
    'reduce':      1,
    'reduceRight': 1,
    'every':       1,
    'filter':      1,
    'some':        1
  };

  function check(node) {
    var argument;

    if (node.type === 'CallExpression' && node.callee &&
      node.callee.property && requiredReturn[node.callee.property.name]) {
      argument = node['arguments'][0];

      if (argument && argument.type === 'FunctionExpression') {
        var block = argument.body.body,
          returnFound = false;

        if (argument.params.length === 0) {
          logError(node, 'functional_arguments', 'WHERE THE FUCK ARE THE ARGUMENTS?');
        }

        for (var i = 0; i < block.length; i++) {
          if (block[i].type === 'ReturnStatement') {
            returnFound = true;
            break;
          }
        }

        if (!returnFound) {
          logError(node, 'functional_return', 'WHERE THE FUCK IS RETURN?');
        }
      }
    }
  }

  return check;
};
