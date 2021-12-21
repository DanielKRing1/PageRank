import DictUtils from '@asianpersonn/dict-utils';

import { getInitialWeights, inflateEdgeAttrs, pageRank, redistributeNodeWeight, scaleEdgeAttrs } from "../src/pageRank";
import { Dict } from "../src/types";

type TestNode = {
    id: string,
    edgeIds: string[],
    value: number,
};
const nodes1: TestNode[] = [
    {
        id: 'a',
        edgeIds: ['ab', 'ac', 'ad'],
        value: 10
    },
    {
        id: 'b',
        edgeIds: ['ba', 'bc'],
        value: 8
    },
    {
        id: 'c',
        edgeIds: ['ca', 'cb', 'cd'],
        value: 6
    },
    {
        id: 'd',
        edgeIds: ['da', 'dc'],
        value: 4
    },
];
const node1Map: Dict<TestNode> = nodes1.reduce((nodeMap: Dict<TestNode>, node: TestNode) => {
    nodeMap[node.id] = node;
    return nodeMap;
}, {});

const nodes2: TestNode[] = [
    {
        id: 'a',
        edgeIds: ['ab', 'ac', 'ad'],
        value: 4
    },
    {
        id: 'b',
        edgeIds: ['ba', 'bc'],
        value: 6
    },
    {
        id: 'c',
        edgeIds: ['ca', 'cb', 'cd'],
        value: 8
    },
    {
        id: 'd',
        edgeIds: ['da', 'dc'],
        value: 10
    },
];
const node2Map: Dict<TestNode> = nodes2.reduce((nodeMap: Dict<TestNode>, node: TestNode) => {
    nodeMap[node.id] = node;
    return nodeMap;
}, {});

type TestEdge = {
    id: string,
    node1Id: string,
    node2Id: string,
    value: number,
};
const edges: TestEdge[] = [
    {
        id: 'ab',
        node1Id: 'a',
        node2Id: 'b',
        value: 10,
    },
    {
        id: 'ac',
        node1Id: 'a',
        node2Id: 'c',
        value: 8,
    },
    {
        id: 'ad',
        node1Id: 'a',
        node2Id: 'd',
        value: 6,
    },
    {
        id: 'ba',
        node1Id: 'b',
        node2Id: 'a',
        value: 10,
    },
    {
        id: 'bc',
        node1Id: 'b',
        node2Id: 'c',
        value: 7,
    },
    {
        id: 'ca',
        node1Id: 'c',
        node2Id: 'a',
        value: 8,
    },
    {
        id: 'cb',
        node1Id: 'c',
        node2Id: 'b',
        value: 7,
    },
    {
        id: 'cd',
        node1Id: 'c',
        node2Id: 'd',
        value: 5,
    },
    {
        id: 'da',
        node1Id: 'd',
        node2Id: 'a',
        value: 6,
    },
    {
        id: 'dc',
        node1Id: 'd',
        node2Id: 'c',
        value: 5,
    },
]
const edgeMap: Dict<TestEdge> = edges.reduce((edgeMap: Dict<TestEdge>, edge: TestEdge) => {
    edgeMap[edge.id] = edge;
    return edgeMap;
}, {});

const getNodeId = (node: TestNode): string => node.id;
const getNodeAttrs = (node: TestNode): Dict<number> => DictUtils.copyDictKeep(node, ['value']) as Dict<number>;

const getEdges = (node: TestNode): TestEdge[] => node.edgeIds.map((edgeId: string) => edgeMap[edgeId]);
const getEdgeAttrs = (edge: TestEdge): Dict<number> => DictUtils.copyDictKeep(edge, ['value']) as Dict<number>;
const getDestinationNode1 = (node: TestNode, edge: TestEdge): TestNode => edge.node1Id == node.id ? node1Map[edge.node2Id] : node1Map[edge.node1Id];
const getDestinationNode2 = (node: TestNode, edge: TestEdge): TestNode => edge.node1Id == node.id ? node2Map[edge.node2Id] : node2Map[edge.node1Id];

describe('Performing PageRank with the given input', () => {
    it('Should produce predictable output', () => {
        const initialMap1: Dict<Dict<number>> = getInitialWeights(nodes1, getNodeId, getNodeAttrs);
        const outputWeights1: Dict<Dict<number>> = pageRank(initialMap1, nodes1, getNodeId, getEdges, getEdgeAttrs, getDestinationNode1, 0, 1);
        const expectedWeights1: Dict<Dict<number>> = {
            a: {
                value: 0.3317035905271199,
            },
            b: {
                value: 0.2238095238095238,
            },
            c: {
                value: 0.30162974280621335,
            },
            d: {
                value: 0.14285714285714285,
            }
        };
        expect(outputWeights1).toEqual(expectedWeights1);

        console.log(outputWeights1);
    });

    it('Should produce expected Page Rank output', () => {
        const initialMap2: Dict<Dict<number>> = getInitialWeights(nodes2, getNodeId, getNodeAttrs);
        const outputWeights2: Dict<Dict<number>> = pageRank(initialMap2, nodes2, getNodeId, getEdges, getEdgeAttrs, getDestinationNode2, 0, 1);
        const expectedWeights2: Dict<Dict<number>> = {
            a: {
                value: 0.4351413292589763,
            },
            b: {
                value: 0.1595238095238095,
            },
            c: {
                value: 0.298192004074357,
            },
            d: {
                value: 0.10714285714285714,
            },
        };
        expect(outputWeights2).toEqual(expectedWeights2);

        console.log(outputWeights2);
    });

    it('Should produce predictable output', () => {
        const initialMap1: Dict<Dict<number>> = getInitialWeights(nodes1, getNodeId, getNodeAttrs);
        const outputWeights1: Dict<Dict<number>> = pageRank(initialMap1, nodes1, getNodeId, getEdges, getEdgeAttrs, getDestinationNode1, 50);

        console.log('Raw 1:');
        console.log(outputWeights1);
    });

    it('Should produce expected Page Rank output', () => {
        const initialMap2: Dict<Dict<number>> = getInitialWeights(nodes2, getNodeId, getNodeAttrs);
        const outputWeights2: Dict<Dict<number>> = pageRank(initialMap2, nodes2, getNodeId, getEdges, getEdgeAttrs, getDestinationNode2, 50);

        console.log('Raw 2:');
        console.log(outputWeights2);
    });

    it('Should Page Rank redistributed node weights', () => {
        const initialMap1: Dict<Dict<number>> = getInitialWeights(nodes1, getNodeId, getNodeAttrs);
        const redistributedMap1: Dict<Dict<number>> = redistributeNodeWeight(initialMap1, 0.5, ['b']);
        
        const outputWeights1: Dict<Dict<number>> = pageRank(redistributedMap1, nodes1, getNodeId, getEdges, getEdgeAttrs, getDestinationNode1, 50);
        
        console.log('Redistributed node weights 1:');
        console.log(outputWeights1);
    });

    it('Should Page Rank redistributed node weights', () => {
        const initialMap2: Dict<Dict<number>> = getInitialWeights(nodes2, getNodeId, getNodeAttrs);
        const redistributedMap2: Dict<Dict<number>> = redistributeNodeWeight(initialMap2, 0.5, ['b']);
        
        const outputWeights2: Dict<Dict<number>> = pageRank(redistributedMap2, nodes2, getNodeId, getEdges, getEdgeAttrs, getDestinationNode2, 50);
        
        console.log('Redistributed node weights 2:');
        console.log(outputWeights2);
    });
    
    it('Should Page Rank scaled edge attrs', () => {
        const initialMap1: Dict<Dict<number>> = getInitialWeights(nodes1, getNodeId, getNodeAttrs);
        
        const centralNodeIds: Set<string> = new Set(['b']);
        const newEdges: TestEdge[] = scaleEdgeAttrs(edges, getEdgeAttrs, 2, (edge: TestEdge) => centralNodeIds.has(edge.node1Id) || centralNodeIds.has(edge.node2Id));
        const newEdgeMap: Dict<TestEdge> = newEdges.reduce((edgeMap: Dict<TestEdge>, edge: TestEdge) => {
            edgeMap[edge.id] = edge;
            return edgeMap;
        }, {});

        const newGetEdges = (node: TestNode): TestEdge[] => node.edgeIds.map((edgeId: string) => newEdgeMap[edgeId]);
        const outputWeights1: Dict<Dict<number>> = pageRank(initialMap1, nodes1, getNodeId, newGetEdges, getEdgeAttrs, getDestinationNode1, 50);
        
        console.log('Scaled edge attrs 1:');
        console.log(outputWeights1);
    });

    it('Should Page Rank scaled edge attrs', () => {
        const initialMap2: Dict<Dict<number>> = getInitialWeights(nodes2, getNodeId, getNodeAttrs);
        
        const centralNodeIds: Set<string> = new Set(['b']);
        const newEdges: TestEdge[] = scaleEdgeAttrs(edges, getEdgeAttrs, 10, (edge: TestEdge) => centralNodeIds.has(edge.node1Id) || centralNodeIds.has(edge.node2Id));
        console.log(newEdges);
        const newEdgeMap: Dict<TestEdge> = newEdges.reduce((edgeMap: Dict<TestEdge>, edge: TestEdge) => {
            edgeMap[edge.id] = edge;
            return edgeMap;
        }, {});

        const newGetEdges = (node: TestNode): TestEdge[] => node.edgeIds.map((edgeId: string) => newEdgeMap[edgeId]);
        const outputWeights2: Dict<Dict<number>> = pageRank(initialMap2, nodes2, getNodeId, newGetEdges, getEdgeAttrs, getDestinationNode2, 50);
        
        console.log('Scaled edge attrs 2:');
        console.log(outputWeights2);
    });

    it('Should Page Rank inflated edge attrs', () => {
        const initialMap1: Dict<Dict<number>> = getInitialWeights(nodes1, getNodeId, getNodeAttrs);
        
        const centralNodeIds: Set<string> = new Set(['b']);
        const newEdges: TestEdge[] = inflateEdgeAttrs(edges, getEdgeAttrs, 0.5, (edge: TestEdge) => centralNodeIds.has(edge.node1Id) || centralNodeIds.has(edge.node2Id));
        const newEdgeMap: Dict<TestEdge> = newEdges.reduce((edgeMap: Dict<TestEdge>, edge: TestEdge) => {
            edgeMap[edge.id] = edge;
            return edgeMap;
        }, {});

        const newGetEdges = (node: TestNode): TestEdge[] => node.edgeIds.map((edgeId: string) => newEdgeMap[edgeId]);
        const outputWeights1: Dict<Dict<number>> = pageRank(initialMap1, nodes1, getNodeId, newGetEdges, getEdgeAttrs, getDestinationNode1, 50);
        
        console.log('Inflated edge attrs 1:');
        console.log(outputWeights1);
    });

    it('Should Page Rank inflated edge attrs', () => {
        const initialMap2: Dict<Dict<number>> = getInitialWeights(nodes2, getNodeId, getNodeAttrs);
        
        const centralNodeIds: Set<string> = new Set(['b']);
        const newEdges: TestEdge[] = inflateEdgeAttrs(edges, getEdgeAttrs, 0.1, (edge: TestEdge) => centralNodeIds.has(edge.node1Id) || centralNodeIds.has(edge.node2Id));
        console.log(newEdges);
        const newEdgeMap: Dict<TestEdge> = newEdges.reduce((edgeMap: Dict<TestEdge>, edge: TestEdge) => {
            edgeMap[edge.id] = edge;
            return edgeMap;
        }, {});

        const newGetEdges = (node: TestNode): TestEdge[] => node.edgeIds.map((edgeId: string) => newEdgeMap[edgeId]);
        const outputWeights2: Dict<Dict<number>> = pageRank(initialMap2, nodes2, getNodeId, newGetEdges, getEdgeAttrs, getDestinationNode2, 50);
        
        console.log('Inflated edge attrs 2:');
        console.log(outputWeights2);
    });
});