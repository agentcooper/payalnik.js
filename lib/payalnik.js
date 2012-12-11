var payalnik = {};

var esprima = require('esprima'),
    es6shim = require('es6-shim');

var conditions = {};
payalnik.addTraverseCheck = function(name, condition) {
  conditions[name] = condition;
};

function traverse(object, visitor, flag) {
  'use strict';

  var key, child;

  visitor.call(null, object, flag);
  for (key in object) {
      if (object.hasOwnProperty(key)) {
          child = object[key];
          if (typeof child === 'object' && child !== null) {

              flag = flag || {};
              for (var cond in conditions) {
                if (!flag[cond]) {
                  if (conditions[cond](child)) {
                    flag[cond] = true;
                  }
                }
              }

              traverse(child, visitor, flag);
          }
      }
  }
}



payalnik.traverse = traverse;

function logError(node, errorCode, message, args) {
  'use strict';

  var toLog = [errorCode, node.loc.start.line];

  if (typeof args !== 'undefined') {
    toLog.push(args);
  }

  payalnik.log.push(toLog);

  if (typeof payalnik.output !== 'undefined') {
    console.log("LINE " + node.loc.start.line + ": " + payalnik.lines[node.loc.start.line - 1]);
    console.log(message);
    console.log();
  }
}

payalnik.logError = logError;

var CHECK = {},
    modules = [
      'filter',
      'self',
      'bitshift',
      'timeout',
      'typeofExpression',
      'jsdoc'
    ];

modules.forEach(function(module) {
  'use strict';
  CHECK[module] = require('./check/' + module)(payalnik);
});

function run(file, output) {
  'use strict';

  payalnik.file = file;

  var log = [];
  payalnik.log = log;

  payalnik.output = output;

payalnik.logError = logError;

var lines = file.split("\n"),
  parsed = esprima.parse(file, {
    loc: true,
    comment: true,
    range: true
  });

payalnik.lines = lines;

function shady(node) {
  console.log('SHADY PART AT LINE ' + node.loc.start.line + ": " +lines[node.loc.start.line - 1]);
}

var docs = {},
    paramLine = /\@param\s+{([\(\)A-Za-z|=\']+)}\s+([_$A-Za-z0-9]+)/i,
    argument;

payalnik.docs = docs;

// parse jsdocs comments to docs object
traverse(parsed.comments, function(node) {
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
traverse(parsed.body, function(node, flag) {
  var argument;

  // filter, map and other Array.prototype function checks
  CHECK.filter(node);

  // disallow use of self and others
  CHECK.self(node);

  // no bitshifting allowed
  CHECK.bitshift(node);

  CHECK.timeout(node, flag);

  CHECK.jsdoc(node);

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

  // typeof
  CHECK.typeofExpression(node);
});

  return log;
}

module.exports = run;
