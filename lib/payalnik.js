var esprima = require('esprima'),
    es6shim = require('es6-shim');

function run(file, silent) {
  'use strict';

var lines = file.split("\n"),
  parsed = esprima.parse(file, {
    loc: true,
    comment: true,
    range: true
  });

var log = [];


function traverse(object, visitor) {
    var key, child;

    visitor.call(null, object);
    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null) {
                traverse(child, visitor);
            }
        }
    }
}

function logError(node, errorCode, message, args) {
  var toLog = [errorCode, node.loc.start.line];

  if (typeof args !== 'undefined') {
    toLog.push(args);
  }

  log.push(toLog);

  if (typeof silent !== 'undefined') {
    console.log("LINE " + node.loc.start.line + ": " + lines[node.loc.start.line - 1]);
    console.log(message);
    console.log();
  }
}

function shady(node) {
  console.log('SHADY PART AT LINE ' + node.loc.start.line + ": " +lines[node.loc.start.line - 1]);
}

var requiredReturn = {
  'map':         1,
  'reduce':      1,
  'reduceRight': 1,
  'every':       1,
  'filter':      1,
  'some':        1
};

var crazyshitOps = {
  '>>':  1,
  '>>>': 1,
  '<<':  1,
  '<<<': 1
};

var timed = {
  'setTimeout': 1,
  'setInterval': 1
};

var docs = {},
    paramLine = /\@param\s+{([A-Za-z|=\']+)}\s+([_$A-Za-z0-9]+)/i,
    argument;

// check FD and FE for jsdoc params
function check(func, jsdoc) {
  'use strict';
  var params = func.params.map(function(item) {
    return item.name;
  });

  if (jsdoc.join(',') !== params.join(',')) {
    logError(func, 'jsdoc', 'YOUR JSDOC FUCKING SAYS "' + jsdoc.join(', ') + '"', [jsdoc]);
  }
}

function checkThis(node) {
  traverse(node, function(inNode) {
    if(inNode.type === "ThisExpression") {
      logError(inNode, 'wrong_this', 'FUCKING THIS');
    }
  });
}

// parse jsdocs comments to docs object
traverse(parsed.comments, function(node) {
  'use strict';

  if (node.value) {
    var params = node.value.split("\n").filter(function(line) {
      return line.contains('@param');
    }).map(function(line) {
      var matches = line.match(paramLine);

      if (matches && matches.length > 2) {
        if (matches[2].charAt(0).charAt(0).match(/[A-Z]/)) {
          console.log('big letter? rly?');
        }
        return matches[2];
      }

      return false;
    });

    if (params.length > 0) {
      docs[node.range[1]] = params;
    }
  }
});

// main traverse
traverse(parsed.body, function(node) {
  'use strict';
  var i, argument;

  // filter, map and other Array.prototype function checks
  if (node.type === 'CallExpression' && node.callee &&
    node.callee.property && requiredReturn[node.callee.property.name]) {
    argument = node['arguments'][0];

    if (argument && argument.type === 'FunctionExpression') {
      var block = argument.body.body,
        returnFound = false;

      if (argument.params.length === 0) {
        logError(node, 'functional_arguments', 'WHERE THE FUCK ARE THE ARGUMENTS?');
      }

      for (i = 0; i < block.length; i++) {
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


  // disallow use of self and others
  if (node.type === 'VariableDeclarator' && node.init && node.init.type === "ThisExpression") {
    if (node.id.name !== 'that') {
      logError(node, 'not_that', 'THE FUCK IS "' + node.id.name + '", USE "THAT"!', [node.id.name]);
    }
  }


  // no bitshifting allowed
  if (crazyshitOps[node.operator]) {
    logError(node, 'bitshift', 'WHY THE FUCK DO YOU NEED THIS BITSHIFTERY SHIT?');
  }


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

  // inform about Window assigment
  if (node.type === "AssignmentExpression") {
    if (node.left.object && node.left.object.name === "window") {
      shady(node);
    }
  }


  // when in jquery widget, check for global selectors
  if (node.type === "CallExpression" && node.callee.object && node.callee.object.name === "$" &&
    node.callee.property.name === "widget") {

    argument = node['arguments'][2];
    if (!argument) {
      return;
    }

    traverse(argument, function(inNode) {
      if (inNode.type === "CallExpression" &&
        (inNode.callee.name === "$" || inNode.callee.name === "jQuery")) {

        var type = inNode['arguments'][0].type;

        if (type === "ThisExpression" ||
          type === "Identifier" ||
          type === "FunctionExpression" ||
          type === "Literal" && inNode['arguments'][0].value.charAt(0) !== '.') {
          return;
        }

        if (inNode['arguments'][0].type === "MemberExpression") {

          var z = inNode['arguments'][0];
          while (z) {
            z = z.object;
            if (z && z.type === "ThisExpression") {
              return;
            }
          }

        }

        logError(inNode, 'probably_global', 'THE FUCK? PROBABLY GLOBAL SELECTOR');
      }
    });
  }
});

  return log;
}

// console.log(run(file, true));

module.exports = run;