module.exports = function(payalnik) {
  'use strict';

  var logError = payalnik.logError;

  function check(node) {
		if (node.type === 'VariableDeclarator' && node.init && node.init.type === "ThisExpression") {
	    if (node.id.name !== 'that') {
	      logError(node, 'not_that', 'THE FUCK IS "' + node.id.name + '", USE "THAT"!', [node.id.name]);
	    }
	  }
  }

  return check;
};
