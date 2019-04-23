import { Graph } from 'agora-graph';
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
export declare function gml(data: string): GML;
export default function toGraph(gml: GML): Graph;
export {};
