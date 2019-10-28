"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = __importDefault(require("lodash"));
var NODE = 'node';
var EDGE = 'edge';
var SEPARATOR = /\s+/;
var TEXT = '"';
var ARRAY = '[';
var END_ARRAY = ']';
var IGNORE = '\\';
function isGraph(graph) {
    return (graph.edges !== undefined && graph.nodes !== undefined);
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
    }
    else {
        // if is not :) and number check
        value = isNaN(+val) ? val : +val;
    }
    if (key === EDGE || key === NODE) {
        (tree[key] || (tree[key] = [])).push(value);
    }
    else if (key in tree) {
        if (!Array.isArray(tree[key])) {
            var copy = tree[key];
            tree[key] = [];
            tree[key].push(copy);
        }
        tree[key].push(value);
    }
    else {
        tree[key] = value;
    }
    return ++index;
}
function split(str) {
    var list = [];
    var ignoreNext = false;
    var textIndex = -1;
    var beginIndex = -1;
    lodash_1.default.forEach(str, function (chr, index) {
        if (chr === TEXT && !ignoreNext) {
            // we're beginning or ending a text
            if (textIndex >= 0) {
                // if we're closing a text
                list.push(str.substr(textIndex, index - textIndex));
                textIndex = -1;
            }
            else {
                // we're beginning a text
                textIndex = index + 1;
            }
        }
        else if (textIndex === -1) {
            // we're not inside a text
            if (SEPARATOR.test(chr)) {
                // is a space
                if (beginIndex >= 0) {
                    // It's the end of the word as we know it
                    list.push(str.substr(beginIndex, index - beginIndex));
                }
                beginIndex = -1; // resetting word length
            }
            else if (beginIndex === -1) {
                // no word before, word first index
                beginIndex = index;
            }
        }
        if (chr === IGNORE)
            ignoreNext = true;
        else if (ignoreNext)
            ignoreNext = false;
    });
    if (beginIndex >= 0) {
        list.push(str.substr(beginIndex));
    }
    return list;
}
function gmlify(key, value, padding) {
    if (padding === void 0) { padding = ''; }
    var aggregated = '';
    if (Array.isArray(value))
        return lodash_1.default.reduce(value, function (result, iter) { return result + gmlify(key, iter, padding); }, '');
    else if (typeof value === 'object') {
        aggregated = '[\n';
        // iterate over object
        aggregated += lodash_1.default.reduce(value, function (acc, value, key) { return acc + gmlify(key, value, padding + '  '); }, '');
        aggregated += padding + ']';
    }
    else
        aggregated = JSON.stringify(value);
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
    var nodes = jsGraph.nodes, edges = jsGraph.edges, _a = jsGraph.meta, _b = _a === void 0 ? { _global: {} } : _a, _global = _b._global, graphMeta = __rest(_b, ["_global"]);
    // mapping nodes
    var node = lodash_1.default.map(nodes, function (_a) {
        var id = _a.index, label = _a.label, _b = _a.meta, _c = _b === void 0 ? { _graphics: {} } : _b, _graphics = _c._graphics, meta = __rest(_c, ["_graphics"]), x = _a.x, y = _a.y, w = _a.width, h = _a.height;
        return (__assign({ id: id,
            label: label }, meta, { graphics: __assign({}, _graphics, { x: x, y: y, w: w, h: h }) }));
    });
    // mapping edges
    var edge = lodash_1.default.map(edges, function (_a) {
        var source = _a.source, target = _a.target, meta = _a.meta;
        return (__assign({ source: source,
            target: target }, meta));
    });
    // building graph
    var graph = __assign({}, graphMeta, { node: node, edge: edge });
    // building final structure
    var gml = __assign({}, _global, { graph: graph });
    return gml;
}
function toGMLObject(jsGraph) {
    if (typeof jsGraph === 'string') {
        return stringToGMLObject(jsGraph);
    }
    return graphToGMLObject(jsGraph);
}
exports.toGMLObject = toGMLObject;
function toGraph(gml) {
    if (typeof gml === 'string') {
        return toGraph(stringToGMLObject(gml));
    }
    if (gml.graph === undefined)
        throw new Error('GML has no graph attribute');
    // putting _global meta
    var graph = gml.graph, _global = __rest(gml, ["graph"]);
    var node = graph.node, edge = graph.edge, meta = __rest(graph, ["node", "edge"]);
    return {
        edges: lodash_1.default.map(edge, function (_a) {
            var source = _a.source, target = _a.target, meta = __rest(_a, ["source", "target"]);
            return ({
                source: source,
                target: target,
                meta: meta
            });
        }),
        nodes: lodash_1.default.map(node, function (_a) {
            var index = _a.id, label = _a.label, _b = _a.graphics, _c = _b === void 0 ? {
                x: 0,
                y: 0,
                w: 0,
                h: 0
            } : _b, _d = _c.x, x = _d === void 0 ? 0 : _d, _e = _c.y, y = _e === void 0 ? 0 : _e, _f = _c.w, width = _f === void 0 ? 0 : _f, _g = _c.h, height = _g === void 0 ? 0 : _g, _graphics = __rest(_c, ["x", "y", "w", "h"]), meta = __rest(_a, ["id", "label", "graphics"]);
            return ({
                index: index,
                label: label || '' + index,
                x: x,
                y: y,
                width: width,
                height: height,
                meta: __assign({ _graphics: _graphics }, meta)
            });
        }),
        meta: __assign({ _global: _global }, meta)
    };
}
exports.toGraph = toGraph;
function toGML(graph) {
    if (isGraph(graph))
        return toGML(graphToGMLObject(graph));
    // we need to layout an object
    return lodash_1.default.reduce(graph, function (acc, value, key) { return acc + gmlify(key, value); }, '');
}
exports.toGML = toGML;
