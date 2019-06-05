import { Graph } from 'agora-graph';
import _ from 'lodash';

const NODE = 'node';
const EDGE = 'edge';
const SEPARATOR = /\s+/;
const TEXT = '"';
const ARRAY = '[';
const END_ARRAY = ']';
const IGNORE = '\\';

interface Global {
  id?: number;
  label?: string;
  comment?: string;
  Creator?: string;
  [key: string]: any;

  graphics?: {
    x?: number;
    y?: number;
    z?: number;
    w?: number;
    h?: number;
    d?: number;
  };
}

interface GMLNode extends Global {
  id: number;
}

interface GMLEdge extends Global {
  source: number;
  target: number;
}

interface GMLGraph extends Global {
  directed?: number;
  isPlanar?: number;
  node: GMLNode[];
  edge: GMLEdge[];
}

interface GML {
  graph?: GMLGraph;
}

export function gml(data: string): GML {
  const list = split(data.trim());
  const graph: GML = {};

  let index = 0;
  while (index < list.length) {
    index = pair(graph, list, index);
  }
  return graph;
}

function pair(
  tree: { [key: string]: any },
  list: string[],
  index: number
): number {
  const key = list[index].toLowerCase();
  const val = list[++index];
  let value;

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
      const copy = tree[key];
      tree[key] = [];
      tree[key].push(copy);
    }

    tree[key].push(value);
  } else {
    tree[key] = value;
  }

  return ++index;
}

function split(str: string): string[] {
  const list: string[] = [];

  let ignoreNext = false;
  let textIndex = -1;
  let beginIndex = -1;

  _.forEach(str, (chr, index) => {
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

    if (chr === IGNORE) ignoreNext = true;
    else if (ignoreNext) ignoreNext = false;
  });

  if (beginIndex >= 0) {
    list.push(str.substr(beginIndex));
  }

  return list;
}

export default function toGraph(gml: GML): Graph {
  if (gml.graph === undefined) throw 'GML has no graph attribute';
  return {
    edges: _.map(gml.graph.edge, e => ({
      source: e.source,
      target: e.target
    })),
    nodes: _.map(gml.graph.node, n => ({
      index: n.id,
      label: '' + n.label,
      x: n.graphics ? n.graphics.x || 0 : 0,
      y: n.graphics ? n.graphics.y || 0 : 0,
      width: n.graphics ? n.graphics.w || 0 : 0,
      height: n.graphics ? n.graphics.h || 0 : 0
    }))
  };
}
