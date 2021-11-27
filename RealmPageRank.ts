import {TrendBlueprint} from '../../realm/Realm/Trends/TrendBlueprint';
import * as DictUtil from '../dictionary/Operations';
import {getInitialWeights, redistributeWeight, pageRank} from './pageRank';

export type RedistributionOptions = {
  targetCentralWeight: number;
  centralNodeIds: string[];
};
export function realmPageRank<N, E>(
  trendBlueprint: TrendBlueprint,
  allNodes: TrendNode[],
  allEdges: TrendEdge[],
  iterations: number,
  dampingFactor: number = 0.85,
  redistributionOptions?: RedistributionOptions,
): Dict<Dict<number>> {
  // 0. Define methods for custom pageRank implementation
  const getNodeId = (node: TrendNode) => node.id;
  const getNodeAttrs = (node: TrendNode): Dict<number> => (DictUtil.copyDictKeep(node, trendBlueprint.getProperties()) as unknown) as Dict<number>;
  const getEdges = (node: TrendNode): TrendEdge[] => node.edges.map((edgeId: string) => TREND_EDGES_DICT[edgeId]);
  const getEdgeAttrs = (edge: TrendEdge): Dict<number> => (DictUtil.copyDictKeep(edge, trendBlueprint.getProperties()) as unknown) as Dict<number>;
  const getDestinationNode = (node: TrendNode, edge: TrendEdge): TrendNode => {
    const destinationNodeId: string = edge.nodes.filter((nodeId: string) => nodeId !== getNodeId(node))[0];

    return allNodesDict[destinationNodeId];
  };

  // 1.1. Map 'allNodes' into a a hashmap
  const allNodesDict: Dict<TrendNode> = allNodes.reduce((acc: Dict<TrendNode>, curNode: TrendNode) => {
    const edgeId: string = curNode.id;
    acc[edgeId] = curNode;

    return acc;
  }, {});

  // 1.2. Map 'allEdges' into a hashmap
  const TREND_EDGES_DICT: Dict<TrendEdge> = allEdges.reduce((acc: Dict<TrendEdge>, curEdge: TrendEdge) => {
    const edgeId: string = curEdge.id;
    acc[edgeId] = curEdge;

    return acc;
  }, {});

  // 2. Get the initial weights of the provided 'allNodes'
  const initialMap = getInitialWeights<TrendNode, TrendEdge>(allNodes, getNodeId, getNodeAttrs);

  // 3. Optional, redistribute weights to 'artificially inflate the weight' of nodes of interest
  // This can be done to: Find the 'most influential' nodes after labeling some nodes as 'central nodes' (that have been 'done' today), ie
  //    What nodes are now most important, given that some set of 'central' nodes have been done today (and should therefore be given more weight)?
  const redistributedWeights = redistributionOptions !== undefined ? redistributeWeight(initialMap, redistributionOptions.targetCentralWeight, redistributionOptions.centralNodeIds) : initialMap;

  // 4. Execute Page Rank
  const pageRankResult: Dict<Dict<number>> = pageRank(redistributedWeights, allNodes, getNodeId, getEdges, getEdgeAttrs, getDestinationNode, iterations, dampingFactor);

  return pageRankResult;
}
