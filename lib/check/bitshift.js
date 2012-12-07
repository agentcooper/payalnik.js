module.exports = function(payalnik) {
  'use strict';

  var logError = payalnik.logError;

	var crazyshitOps = {
	  '>>':  1,
	  '>>>': 1,
	  '<<':  1,
	  '<<<': 1
	};

  function check(node) {
		if (crazyshitOps[node.operator]) {
	    logError(node, 'bitshift', 'WHY THE FUCK DO YOU NEED THIS BITSHIFTERY SHIT?');
	  }
  }

  return check;
};
