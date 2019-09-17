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
function parseGML(data) {
    var list = split(data.trim());
    var graph = {};
    var index = 0;
    while (index < list.length) {
        index = pair(graph, list, index);
    }
    return graph;
}
exports.parseGML = parseGML;
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
function toGraph(gml) {
    if (gml.graph === undefined)
        throw new Error('GML has no graph attribute');
    var graph = gml.graph, rest = __rest(gml, ["graph"]);
    return {
        edges: lodash_1.default.map(graph.edge, function (_a) {
            var source = _a.source, target = _a.target, rest = __rest(_a, ["source", "target"]);
            return ({
                source: source,
                target: target,
                meta: __assign({}, rest)
            });
        }),
        nodes: lodash_1.default.map(graph.node, function (_a) {
            var index = _a.id, label = _a.label, _b = _a.graphics, _c = _b === void 0 ? {
                x: 0,
                y: 0,
                w: 0,
                h: 0
            } : _b, _d = _c.x, x = _d === void 0 ? 0 : _d, _e = _c.y, y = _e === void 0 ? 0 : _e, _f = _c.w, width = _f === void 0 ? 0 : _f, _g = _c.h, height = _g === void 0 ? 0 : _g, rest = __rest(_a, ["id", "label", "graphics"]);
            return ({
                index: index,
                label: label || '' + index,
                x: x,
                y: y,
                width: width,
                height: height,
                meta: __assign({}, rest)
            });
        })
    };
}
exports.toGraph = toGraph;
