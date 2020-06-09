'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _ = _interopDefault(require('lodash'));

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

var defineProperty = _defineProperty;

function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i;

  for (i = 0; i < sourceKeys.length; i++) {
    key = sourceKeys[i];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }

  return target;
}

var objectWithoutPropertiesLoose = _objectWithoutPropertiesLoose;

function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = objectWithoutPropertiesLoose(source, excluded);
  var key, i;

  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }

  return target;
}

var objectWithoutProperties = _objectWithoutProperties;

function createCommonjsModule(fn, basedir, module) {
	return module = {
	  path: basedir,
	  exports: {},
	  require: function (path, base) {
      return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    }
	}, fn(module, module.exports), module.exports;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var _typeof_1 = createCommonjsModule(function (module) {
function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    module.exports = _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    module.exports = _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

module.exports = _typeof;
});

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
var NODE = 'node';
var EDGE = 'edge';
var SEPARATOR = /\s+/;
var TEXT = '"';
var ARRAY = '[';
var END_ARRAY = ']';
var IGNORE = '\\';

function isGraph(graph) {
  return graph.edges !== undefined && graph.nodes !== undefined;
}

function pair(tree, list, index) {
  var key = list[index].toLowerCase();
  var val = list[++index];
  var value;

  if (val === ARRAY) {
    // if is array
    value = {};
    ++index;

    while (list[index] !== END_ARRAY) {
      index = pair(value, list, index);
    }
  } else {
    // if is not :) and number check
    value = isNaN(+val) ? val : +val;
  }

  if (key === EDGE || key === NODE) {
    (tree[key] || (tree[key] = [])).push(value);
  } else if (key in tree) {
    if (!Array.isArray(tree[key])) {
      var copy = tree[key];
      tree[key] = [];
      tree[key].push(copy);
    }

    tree[key].push(value);
  } else {
    tree[key] = value;
  }

  return ++index;
}

function split(str) {
  var list = [];
  var ignoreNext = false;
  var textIndex = -1;
  var beginIndex = -1;

  _.forEach(str, function (chr, index) {
    if (chr === TEXT && !ignoreNext) {
      // we're beginning or ending a text
      if (textIndex >= 0) {
        // if we're closing a text
        list.push(str.substr(textIndex, index - textIndex));
        textIndex = -1;
      } else {
        // we're beginning a text
        textIndex = index + 1;
      }
    } else if (textIndex === -1) {
      // we're not inside a text
      if (SEPARATOR.test(chr)) {
        // is a space
        if (beginIndex >= 0) {
          // It's the end of the word as we know it
          list.push(str.substr(beginIndex, index - beginIndex));
        }

        beginIndex = -1; // resetting word length
      } else if (beginIndex === -1) {
        // no word before, word first index
        beginIndex = index;
      }
    }

    if (chr === IGNORE) ignoreNext = true;else if (ignoreNext) ignoreNext = false;
  });

  if (beginIndex >= 0) {
    list.push(str.substr(beginIndex));
  }

  return list;
}

function gmlify(key, value) {
  var padding = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';
  var aggregated = '';
  if (Array.isArray(value)) return _.reduce(value, function (result, iter) {
    return result + gmlify(key, iter, padding);
  }, '');else if (_typeof_1(value) === 'object') {
    aggregated = '[\n'; // iterate over object

    aggregated += _.reduce(value, function (acc, value, key) {
      return acc + gmlify(key, value, padding + '  ');
    }, '');
    aggregated += padding + ']';
  } else aggregated = JSON.stringify(value);
  return padding + key + ' ' + aggregated + '\n';
}

function stringToGMLObject(data) {
  var list = split(data.trim());
  var graph = {};
  var index = 0;

  while (index < list.length) {
    index = pair(graph, list, index);
  }

  return graph;
}

function graphToGMLObject(jsGraph) {
  // unweaving
  var nodes = jsGraph.nodes,
      edges = jsGraph.edges,
      _jsGraph$meta = jsGraph.meta;
  _jsGraph$meta = _jsGraph$meta === void 0 ? {
    _global: {}
  } : _jsGraph$meta;

  var _global = _jsGraph$meta._global,
      graphMeta = objectWithoutProperties(_jsGraph$meta, ["_global"]); // mapping nodes


  var node = _.map(nodes, function (_ref) {
    var id = _ref.index,
        label = _ref.label,
        _ref$meta = _ref.meta;
    _ref$meta = _ref$meta === void 0 ? {
      _graphics: {}
    } : _ref$meta;

    var _graphics = _ref$meta._graphics,
        meta = objectWithoutProperties(_ref$meta, ["_graphics"]),
        x = _ref.x,
        y = _ref.y,
        w = _ref.width,
        h = _ref.height;

    return _objectSpread(_objectSpread({
      id: id,
      label: label
    }, meta), {}, {
      graphics: _objectSpread(_objectSpread({}, _graphics), {}, {
        x: x,
        y: y,
        w: w,
        h: h
      })
    });
  }); // mapping edges


  var edge = _.map(edges, function (_ref2) {
    var source = _ref2.source,
        target = _ref2.target,
        meta = _ref2.meta;
    return _objectSpread({
      source: source,
      target: target
    }, meta);
  }); // building graph


  var graph = _objectSpread(_objectSpread({}, graphMeta), {}, {
    node: node,
    edge: edge
  }); // building final structure


  var gml = _objectSpread(_objectSpread({}, _global), {}, {
    graph: graph
  });

  return gml;
}

function toGMLObject(jsGraph) {
  if (typeof jsGraph === 'string') {
    return stringToGMLObject(jsGraph);
  }

  return graphToGMLObject(jsGraph);
}
function toGraph(gml) {
  if (typeof gml === 'string') {
    return toGraph(stringToGMLObject(gml));
  }

  if (gml.graph === undefined) throw new Error('GML has no graph attribute'); // putting _global meta

  var graph = gml.graph,
      _global = objectWithoutProperties(gml, ["graph"]);

  var node = graph.node,
      edge = graph.edge,
      meta = objectWithoutProperties(graph, ["node", "edge"]);

  return {
    edges: _.map(edge, function (_ref3) {
      var source = _ref3.source,
          target = _ref3.target,
          meta = objectWithoutProperties(_ref3, ["source", "target"]);

      return {
        source: source,
        target: target,
        meta: meta
      };
    }),
    nodes: _.map(node, function (_ref4) {
      var index = _ref4.id,
          label = _ref4.label,
          _ref4$graphics = _ref4.graphics;
      _ref4$graphics = _ref4$graphics === void 0 ? {
        x: 0,
        y: 0,
        w: 0,
        h: 0
      } : _ref4$graphics;

      var _ref4$graphics$x = _ref4$graphics.x,
          x = _ref4$graphics$x === void 0 ? 0 : _ref4$graphics$x,
          _ref4$graphics$y = _ref4$graphics.y,
          y = _ref4$graphics$y === void 0 ? 0 : _ref4$graphics$y,
          _ref4$graphics$w = _ref4$graphics.w,
          width = _ref4$graphics$w === void 0 ? 0 : _ref4$graphics$w,
          _ref4$graphics$h = _ref4$graphics.h,
          height = _ref4$graphics$h === void 0 ? 0 : _ref4$graphics$h,
          _graphics = objectWithoutProperties(_ref4$graphics, ["x", "y", "w", "h"]),
          meta = objectWithoutProperties(_ref4, ["id", "label", "graphics"]);

      return {
        index: index,
        label: label || '' + index,
        x: x,
        y: y,
        width: width,
        height: height,
        meta: _objectSpread({
          _graphics: _graphics
        }, meta)
      };
    }),
    meta: _objectSpread({
      _global: _global
    }, meta)
  };
}
function toGML(graph) {
  if (isGraph(graph)) return toGML(graphToGMLObject(graph)); // we need to layout an object

  return _.reduce(graph, function (acc, value, key) {
    return acc + gmlify(key, value);
  }, '');
}

exports.toGML = toGML;
exports.toGMLObject = toGMLObject;
exports.toGraph = toGraph;
