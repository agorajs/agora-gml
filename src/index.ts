import type { Graph } from 'agora-graph';
import _ from 'lodash';

const NODE = 'node';
const EDGE = 'edge';
const SEPARATOR = /\s+/;
const TEXT = '"';
const ARRAY = '[';
const END_ARRAY = ']';
const IGNORE = '\\';

function isGraph(graph: object): graph is Graph {
  return (
    (graph as Graph).edges !== undefined && (graph as Graph).nodes !== undefined
  );
}

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

function gmlify(key: string, value: any, padding = ''): string {
  let aggregated = '';
  if (Array.isArray(value))
    return _.reduce(
      value,
      (result, iter) => result + gmlify(key, iter, padding),
      ''
    );
  else if (typeof value === 'object') {
    aggregated = '[\n';
    // iterate over object
    aggregated += _.reduce(
      value,
      (acc, value, key) => acc + gmlify(key, value, padding + '  '),
      ''
    );
    aggregated += padding + ']';
  } else aggregated = JSON.stringify(value);

  return padding + key + ' ' + aggregated + '\n';
}

function stringToGMLObject(data: string): GML {
  const list = split(data.trim());
  const graph: GML = {};

  let index = 0;
  while (index < list.length) {
    index = pair(graph, list, index);
  }
  return graph;
}

function graphToGMLObject(jsGraph: Graph): GML {
  // unweaving
  const {
    nodes,
    edges,
    meta: { _global, ...graphMeta } = { _global: {} },
  } = jsGraph;

  // mapping nodes
  const node = _.map(
    nodes,
    ({
      index: id,
      label,
      meta: { _graphics, ...meta } = { _graphics: {} },
      x,
      y,
      width: w,
      height: h,
    }) => ({
      id,
      label,
      ...meta,
      graphics: { ..._graphics, x, y, w, h },
    })
  );

  // mapping edges
  const edge = _.map(edges, ({ source, target, meta }) => ({
    source,
    target,
    ...meta,
  }));

  // building graph
  const graph = { ...graphMeta, node, edge };

  // building final structure
  const gml = { ..._global, graph };
  return gml;
}

export function toGMLObject(jsGraph: Graph | string): GML {
  if (typeof jsGraph === 'string') {
    return stringToGMLObject(jsGraph);
  }

  return graphToGMLObject(jsGraph);
}

export function toGraph(gml: GML | string): Graph {
  if (typeof gml === 'string') {
    return toGraph(stringToGMLObject(gml));
  }

  if (gml.graph === undefined) throw new Error('GML has no graph attribute');

  // putting _global meta
  const { graph, ..._global } = gml;
  const { node, edge, ...meta } = graph;

  return {
    edges: _.map(edge, ({ source, target, ...meta }) => ({
      source,
      target,
      meta,
    })),
    nodes: _.map(
      node,
      ({
        id: index,
        label,
        graphics: {
          x = 0,
          y = 0,
          w: width = 0,
          h: height = 0,
          ..._graphics
        } = {
          x: 0,
          y: 0,
          w: 0,
          h: 0,
        },
        ...meta
      }) => ({
        index,
        label: label || '' + index,
        x,
        y,
        width,
        height,
        meta: { _graphics, ...meta },
      })
    ),
    meta: { _global, ...meta },
  };
}

export function toGML(graph: Graph | GML): string {
  if (isGraph(graph)) return toGML(graphToGMLObject(graph));

  // we need to layout an object
  return _.reduce(graph, (acc, value, key) => acc + gmlify(key, value), '');
}
