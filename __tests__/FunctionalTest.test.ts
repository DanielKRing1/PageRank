import DictUtils from '@asianpersonn/dict-utils';
import { Dict } from '@asianpersonn/dict-utils/dist/types';
import {getInitialWeights, pageRank, redistributeNodeWeight} from '../src/pageRank';

describe('PageRank algorithm', () => {
  beforeAll(async () => {});

  it('should return correct weighted map after 5 iterations', async () => {
    // expect.assertions(1);

    type Node = {
      name: string;
      rels: string[];
    } & Attrs;

    type Edge = {
      id: string;
      node1: string;
      node2: string;
    } & Attrs;

    type Attrs = {
      attrA: number;
      attrB: number;
    };

    const nodes: Dict<Node> = {
      a: {
        name: 'a',
        rels: ['ab', 'ca', 'da', 'ae'],
        attrA: 1.5,
        attrB: 1.5,
      },
      b: {
        name: 'b',
        rels: ['ab', 'bc'],
        attrA: 1,
        attrB: 1,
      },
      c: {
        name: 'c',
        rels: ['bc', 'ca', 'cd'],
        attrA: 1,
        attrB: 1,
      },
      d: {
        name: 'd',
        rels: ['cd', 'da'],
        attrA: 1,
        attrB: 1,
      },
      e: {
        name: 'e',
        rels: ['ae'],
        attrA: 1,
        attrB: 1,
      },
    };

    const allNodes: Node[] = Object.values(nodes);
    const edges: Dict<Edge> = {
      ab: {
        id: 'ab',
        node1: 'a',
        node2: 'b',
        attrA: 0.6,
        attrB: 0.6,
      },
      bc: {
        id: 'bx',
        node1: 'b',
        node2: 'c',
        attrA: 0.8,
        attrB: 0.8,
      },
      ca: {
        id: 'ca',
        node1: 'c',
        node2: 'a',
        attrA: 1,
        attrB: 1,
      },
      cd: {
        id: 'cd',
        node1: 'c',
        node2: 'd',
        attrA: 1.2,
        attrB: 1.2,
      },
      da: {
        id: 'da',
        node1: 'd',
        node2: 'a',
        attrA: 1.5,
        attrB: 1.5,
      },
      dc: {
        id: 'dc',
        node1: 'd',
        node2: 'c',
        attrA: 2,
        attrB: 2,
      },
      ae: {
        id: 'ae',
        node1: 'a',
        node2: 'e',
        attrA: 3,
        attrB: 3,
      },
    };
    const getNodeId = (node: Node) => node.name;
    const getNodeAttrs = (node: Node) => DictUtils.copyDictRm<any>(node, ['name', 'rels']) as Dict<number>;
    const getEdges = (node: Node): Edge[] => node.rels.map((relId: string) => edges[relId]);
    const getEdgeAttrs = (edge: Edge): Dict<number> => DictUtils.filterDict(edge, (key: string, value: string | number) => !['id', 'node1', 'node2'].includes(key)) as Dict<number>;
    const getDestinationNode = (node: Node, edge: Edge) => (edge.node1 === getNodeId(node) ? nodes[edge.node2] : nodes[edge.node1]);

    // 1. Get initial map, evenly distributed
    const myInitialMap: Dict<Attrs> = {
      a: {
        attrA: 1 / 4,
        attrB: 1 / 4,
      },
      b: {
        attrA: 1 / 4,
        attrB: 1 / 4,
      },
      c: {
        attrA: 1 / 4,
        attrB: 1 / 4,
      },
      d: {
        attrA: 1 / 4,
        attrB: 1 / 4,
      },
    };
    const initialMap = getInitialWeights(allNodes, getNodeId, getNodeAttrs);
    console.log('INITIAL MAP');
    console.log(initialMap);

    const redistributedWeights = redistributeNodeWeight(initialMap, 0.75, ['a', 'b', 'c']);
    console.log('Redistributed weights');
    console.log(redistributedWeights);

    // expect(redistributedWeights).toMatchSnapshot();

    const weightedMap: Dict<Dict<number>> = pageRank(initialMap, allNodes, getNodeId, getEdges, getEdgeAttrs, getDestinationNode, 50);

    console.log('WEIGHTED MAP');
    console.log(weightedMap);

    const initialWeights = {
      a: {
        attrA: 0.125,
        attrB: 0.125,
      },
      b: {
        attrA: 0.125,
        attrB: 0.125,
      },
      c: {
        attrA: 0.125,
        attrB: 0.125,
      },
      d: {
        attrA: 0.125,
        attrB: 0.125,
      },
      e: {
        attrA: 0.125,
        attrB: 0.125,
      },
      f: {
        attrA: 0.125,
        attrB: 0.125,
      },
      g: {
        attrA: 0.1,
        attrB: 0.125,
      },
      h: {
        attrA: 0.15,
        attrB: 0.125,
      },
    };

    // expect(weightedMap).toBe(expectedWeightedMap);
  });
});