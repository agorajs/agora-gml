"use strict";
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
function gml(data) {
    var list = split(data.trim());
    var graph = {};
    var index = 0;
    while (index < list.length) {
        index = pair(graph, list, index);
    }
    return graph;
}
exports.gml = gml;
function pair(tree, list, index) {
    var key = list[index];
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
        throw 'GML has no graph attribute';
    return {
        edges: lodash_1.default.map(gml.graph.edge, function (e) { return ({
            source: e.source,
            target: e.target
        }); }),
        nodes: lodash_1.default.map(gml.graph.node, function (n) { return ({
            index: n.id,
            label: '' + n.label,
            x: n.graphics ? n.graphics.x || 0 : 0,
            y: n.graphics ? n.graphics.y || 0 : 0,
            width: n.graphics ? n.graphics.w || 0 : 0,
            height: n.graphics ? n.graphics.h || 0 : 0
        }); })
    };
}
exports.default = toGraph;
