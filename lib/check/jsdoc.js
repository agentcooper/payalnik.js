module.exports = function(payalnik) {
  'use strict';

  var logError = payalnik.logError;

  // check FD and FE for jsdoc params
  function check(func, jsdoc) {
    var params = func.params.map(function(item) {
      return item.name;
    });

    if (jsdoc.join(',') !== params.join(',')) {
      logError(func, 'jsdoc', 'YOUR JSDOC FUCKING SAYS "' + jsdoc.join(', ') + '"', [jsdoc]);
    }
  }

  function run(node) {
    var file = payalnik.file,
        docs = payalnik.docs;

    var i;
    // jsdoc FD
    if (node.type === "FunctionDeclaration") {
      i = node.range[0];
      while (i--) {
        if (file[i] === ' ' || file[i] === '\n' || file[i] === '\t') {
          continue;
        } else {
          break;
        }
      }

      if (docs[i]) {
        check(node, docs[i]);
      }
    }

    // jsdoc FE
    if (node.type === "Property" && node.value.type === "FunctionExpression") {
      i = node.range[0];
      while (i--) {
        if (file[i] === ' ' || file[i] === '\n' || file[i] === '\t') {
          continue;
        } else {
          break;
        }
      }

      if (docs[i]) {
        check(node.value, docs[i]);
      }
    }
  }

  return run;
};
