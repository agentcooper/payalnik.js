module.exports = function(payalnik) {
  'use strict';

  var logError = payalnik.logError;

	var timed = {
	  'setTimeout': 1,
	  'setInterval': 1
	};

	function checkThis(node) {
	  payalnik.traverse(node, function(inNode) {
	    if(inNode.type === "ThisExpression") {
	      logError(inNode, 'wrong_this', 'FUCKING THIS');
	    }
	  });
	}

  function check(node) {
		var argument;

	  // setTimeout upper scope access
	  if (node.callee && node.callee.type === "Identifier" &&
	    timed[node.callee.name] && node['arguments'][0]) {
	    argument = node['arguments'][0];

	    if (argument.type === "FunctionExpression") {
	      checkThis(argument.body);
	    }
	  }

	  // same, but window.setTimeout
	  if (node.callee && node.callee.type === 'MemberExpression' && node.callee.object &&
	    node.callee.object.name === 'window' && timed[node.callee.property.name] &&
	    node['arguments'][0]) {
	    argument = node['arguments'][0];

	    if (argument.type === 'FunctionExpression') {
	      checkThis(argument.body);
	    }
	  }
  }

  return check;
};
