module.exports = function(payalnik) {
  'use strict';

  var logError = payalnik.logError;

	var timed = {
	  'setTimeout': 1,
	  'setInterval': 1
	};

	payalnik.addTraverseCheck('inTimed', function(node) {
		var argument;

	  // setTimeout upper scope access
	  if (node.callee && node.callee.type === "Identifier" &&
	    timed[node.callee.name] && node['arguments'][0]) {
	    argument = node['arguments'][0];

	    if (argument.type === "FunctionExpression") {
	      return true;
	    }
	  }

	  // same, but window.setTimeout
	  if (node.callee && node.callee.type === 'MemberExpression' && node.callee.object &&
	    node.callee.object.name === 'window' && timed[node.callee.property.name] &&
	    node['arguments'][0]) {
	    argument = node['arguments'][0];

	    if (argument.type === 'FunctionExpression') {
	      return true;
	    }
	  }

	  return false;
	});

	function check(node, flag) {
		if (flag && flag.inTimed) {
			if (node.type === "ThisExpression") {
				logError(node, 'wrong_this', 'FUCKING THIS');
			}
		}
	}

	return check;
};
