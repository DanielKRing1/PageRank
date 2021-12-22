import DictUtils from '@asianpersonn/dict-utils';

import { Dict } from './types';

type ConnectedNode<N> = {
  node: N;
  distance: number;
};

type ConnectedEdge<E> = {
  edge: E;
  distance: number;
};

// function pageRank<N, E>(
//   initialWeights: Dict<number>,
//   allNodes: N[],
//   getId: (node: N) => string,
//   getConnectedNodes: (node: N) => ConnectedNode<N>[],
//   iterations: number,
//   currentIteration: number = 0,
// ): Dict<number> {
//   const nextWeights: Dict<number> = {};

//   // 1. Compute sum of all scores for each node, N, (for each attribute), SN

//   // 2.1. Init a map, M, to track weights for each node, where each node starts with a weight of W, where W is computed as follows:
//   // 2.1. Compute sum of all scores for each relationship, R, of current node (for each attribute), SR
//   // 2.2. Choose arbitrary starting point as "current node"
//   // 2.3. For each node connected to current node, compute weight, W = (R/SR) * (N/SN)
//   // 2.4. Add W to the initial map, M

//   // 3.1. Init a map, NM, to track the weights for each node, for the NEXT ITERATION, where each node start with a weight of 0
//   // 3.2. Choose arbitrary starting point as "current node"
//   // 3.3. For each node conencted to current node, compute next weight, NW, using the curent node's weight, CW, such that NW += CW / (R/SR)

//   // 4. Repeat step 3 until the weights converge

//   return currentIteration < iterations ? pageRank(nextWeights, allNodes, getId, getConnectedNodes, iterations, currentIteration + 1) : nextWeights;
// }

export function pageRank<N, E>(
  initialMap: Dict<Dict<number>>,
  allNodes: N[],
  getNodeId: (node: N) => string,
  getEdges: (node: N) => E[],
  getEdgeAttrs: (edge: E) => Dict<number>,
  getDestinationNode: (node: N, edge: E) => N,
  iterations: number,
  dampingFactor: number = 0.85,
  curIteration: number = 0,
): Dict<Dict<number>> {
  // console.log(`Iteration ${curIteration}`);
  // console.log(initialMap);

  let weightMap: Dict<Dict<number>> = {};

  // 1. For each node
  for (const node of allNodes) {
    const nodeId: string = getNodeId(node);

    // 1.1. Get node's edges
    const nodeEdges: E[] = getEdges(node);
    const allNodeEdgeAttrs: Dict<number>[] = nodeEdges.map((nodeEdge: E) => getEdgeAttrs(nodeEdge));
    // 1.2. Get sum of all node's edges
    const summedNodeEdgeAttrs: Dict<number> = DictUtils.sumDicts(...allNodeEdgeAttrs);

    // 2. For each of node's edges
    for (const nodeEdge of nodeEdges) {
      // @ts-ignore
      // console.log(`Edge id: ${nodeEdge.id}`);
      // 2.1. Get edge's destination node
      const destinationNode: N = getDestinationNode(node, nodeEdge);
      const destinationId: string = getNodeId(destinationNode);

      // 3. Get weight of the current edge, relative to the node's other edges
      const curEdgeAttrs: Dict<number> = getEdgeAttrs(nodeEdge);
      const curEdgeWeights: Dict<number> = DictUtils.divideDictsIgnore0(curEdgeAttrs, summedNodeEdgeAttrs);
      // console.log('edge weight:');
      // console.log(curEdgeWeights);

      // 4. Partition some of the current node's total weight for the current edge's destination node
      const curNodeAttrs: Dict<number> = initialMap[nodeId];
      // console.log('origin node weight:');
      // console.log(curNodeAttrs);
      const destinationNodeAddendWeights: Dict<number> = DictUtils.multiplyDicts(curNodeAttrs, curEdgeWeights);
      // console.log('Addend');
      // console.log(destinationNodeAddendWeights);

      // 5. Add product of the current node weight and the current edge weight to the destination node
      // Sum of all entries in weightMap should equal 1
      weightMap[destinationId] = DictUtils.sumDicts(weightMap[destinationId], destinationNodeAddendWeights);
    }
  }

  // 6. Apply damping factor to weightMap:
  //      - Tax some fraction of weight, d, from each node
  //      - Refund (1 - d) / N weight to each node in the graph
  //      This essentially reduces the gap between popular and unpopular nodes by taking from the rich and redistributing equally to all (including the rich)
  const weightToRedistribute: number = (1 - dampingFactor) / allNodes.length;
  for (const nodeKey in weightMap) {
    const nodeAttrWeights: Dict<number> = weightMap[nodeKey];

    // Take from the rich (Taxes all, but taxing affects 'the rich' more than the poor)
    const taxedAttrWeights: Dict<number> = DictUtils.multiplyDictScalar(nodeAttrWeights, dampingFactor);
    // Refund to the poor (Refunds to all, but refunding affects 'the poor' more than the rich)
    const refundedAttrWeights: Dict<number> = DictUtils.sumDictScalar(taxedAttrWeights, weightToRedistribute);

    weightMap[nodeKey] = refundedAttrWeights;
  }

  return curIteration < iterations ? pageRank(weightMap, allNodes, getNodeId, getEdges, getEdgeAttrs, getDestinationNode, iterations, dampingFactor, curIteration + 1) : weightMap;
}

export function getInitialWeights<N, E>(allNodes: N[], getNodeId: (node: N) => string, getNodeAttrs: (node: N) => Dict<number>): Dict<Dict<number>> {
  // 1.1. Get each node's attributes
  const allNodeAttrs: Dict<number>[] = [];
  for (const node of allNodes) {
    const nodeAttrs: Dict<number> = getNodeAttrs(node);
    allNodeAttrs.push(nodeAttrs);
  }
  // 1.2. Compute total summed node attributes
  const summedNodeAttrs: Dict<number> = DictUtils.sumDicts(...allNodeAttrs);

  // console.log('1');
  // console.log('SUMMED NODE ATTRS');
  // console.log(summedNodeAttrs);

  // 2.1. Get each node's attributes
  let weightMap: Dict<Dict<number>> = {};
  for (const node of allNodes) {
    const nodeAttrs: Dict<number> = getNodeAttrs(node);
    const weightedNodeAttrs: Dict<number> = DictUtils.divideDictsIgnore0(nodeAttrs, summedNodeAttrs);

    // 2. Compute node's weighted edge attributes for each node: weighted node attrs = (node's attrs) / (total summed attrs)
    const nodeId: string = getNodeId(node);
    weightMap[nodeId] = weightedNodeAttrs;
  }

  return weightMap;
}

/**
 * Given a map of normalized node weights (using 'getInitialWeights'),
 *    redistribute weight to the given 'central' nodes, from all of the 'other' nodes.
 * This method will make the sum of the central nodes' weights equal the given 'targetCentralWeight'
 * 
 * @param initialWeights 
 * @param targetCentralWeight 
 * @param centralNodeIds 
 * @returns 
 */
export function redistributeNodeWeight(initialWeights: Dict<Dict<number>>, targetCentralWeight: number, centralNodeIds: string[]): Dict<Dict<number>> {
  // 1. Get "central" weights (in centralNodeIds)
  const centralNodes: Dict<Dict<number>> = DictUtils.copyDictKeep<Dict<number>>(initialWeights, centralNodeIds);
  const centralNodeCount = Object.keys(centralNodes).length;

  // 2. Get "other" weights (not in centralNodeIds)
  const otherNodes: Dict<Dict<number>> = DictUtils.copyDictRm<Dict<number>>(initialWeights, centralNodeIds);
  const otherSummedWeights: Dict<number> = DictUtils.sumDicts(...Object.values(otherNodes));
  const otherNodeCount = Object.keys(otherNodes).length;

  // 3. Sum "central" weights and determine what percentage of weight to redistribute to these central nodes
  const centralSummedWeights: Dict<number> = DictUtils.sumDicts(...Object.values(centralNodes));
  const weightsMissing: Dict<number> = DictUtils.subScalarDict(targetCentralWeight, centralSummedWeights);
  // Clamp min to 0
  const weightTotalToRedistribute: Dict<number> = DictUtils.mutateDict<number>(weightsMissing, (key: string, value: number) => Math.max(0, value));

  const otherWeightToRedistributePercent: Dict<number> = DictUtils.divideDictsIgnore0(weightTotalToRedistribute, otherSummedWeights);
  const otherWeightRemainingPercent: Dict<number> = DictUtils.subScalarDict(1, otherWeightToRedistributePercent);

  // 4. Evenly divide out this percentage from each of the "other" weights
  const dehydratedOtherWeights: Dict<Dict<number>> = DictUtils.mutateDict<Dict<number>>(otherNodes, (key: string, attrDict: Dict<number>) =>
    DictUtils.multiplyDicts(attrDict, otherWeightRemainingPercent),
  );

  // 5. Unevenly add in this percentage to the "central" weights
  const hydratedCentralWeights: Dict<Dict<number>> = DictUtils.mutateDict<Dict<number>>(centralNodes, (key: string, nodeAttrs: Dict<number>) => {
    const hydratedWeights: Dict<number> = {};

    // 5.1. For each central node
    for (const attrKey in nodeAttrs) {
      const attrVal = nodeAttrs[attrKey];

      // 5.2. Compute the weight of each central node, relative to the other central nodes
      const totalWeight = weightTotalToRedistribute[attrKey];
      const nodeWeight = attrVal / centralSummedWeights[attrKey];
      // The weight to redistribute is not equally redistributed among "central" nodes: Central nodes with higher starting weight get a larger cut
      const earnedWeight = totalWeight * nodeWeight;

      hydratedWeights[attrKey] = attrVal + earnedWeight;
    }

    return hydratedWeights;
  });

  return {
    ...dehydratedOtherWeights,
    ...hydratedCentralWeights,
  };
}

/**
 * Given a map of edge weights,
 *    scale up the weight of edges connected to the given 'central' nodes
 * Unlike 'redistributeNodeWeight', this method does not redistribute weight to 'central' edges so that they sum to a given total target weight
 *    bcus this would disproportionately benefit each edge, since
 *    some nodes' sets of 'central' edges might already exceed a given total 'target', while others' might not
 * 
 * @param edges 
 * @param multiplier 
 * @param centralNodeIds 
 * @returns 
 */

export function scaleEdgeAttrs<E>(edges: E[], getEdgeAttrs: (edge: E) => Dict<number>, centralEdgeMultiplier: number, isConnectedToCentralNode: (edge: E) => boolean): E[] {
  return edges.map((edge: E) => {
    // 1. Modify 'central' edges
    if(isConnectedToCentralNode(edge)) {
      // 1.1. Get numeric attributes
      const edgeAttrs: Dict<number> = getEdgeAttrs(edge);
      // 1.2. Apply multiplier
      const modifiedEdgeAttrs: Dict<number> = DictUtils.multiplyDictScalar(edgeAttrs, centralEdgeMultiplier);

      return {
        ...edge,
        ...modifiedEdgeAttrs,
      };

    }
    // 2. Return untouched 'other' edges
    else return { ...edge };
  });
}

/**
 * Magnitude > 0 scales edge attributes up, and
 *    magnitudes < 0 scale edge attributes down
 * 
 * 1    -> Max scaling
 * 0.5  -> Heavy scaling
 * 0.1  -> Light scaling
 * 0.01 -> Very light scaling
 * 0    -> No scaling
 * 
 * @param edges 
 * @param getEdgeAttrs 
 * @param magnitude Number from -1 to 1
 * @param isConnectedToCentralNode 
 * @returns 
 */
export function inflateEdgeAttrs<E>(edges: E[], getEdgeAttrs: (edge: E) => Dict<number>, magnitude: number, isConnectedToCentralNode: (edge: E) => boolean): E[] {
  const MAX_PROPORTION: number = 25;

  // Clamp magnitude between 0 and 1
  magnitude = Math.min(Math.max(magnitude, -1), 1);
  magnitude = (1 / MAX_PROPORTION) * Math.E ** (3.2189 * magnitude);

  const centralTotalAttrs: Dict<number> = edges.reduce((total: Dict<number>, edge: E) => {
    if(isConnectedToCentralNode(edge))  total = DictUtils.sumDicts(total, getEdgeAttrs(edge));

    return total;
  }, {});
  const otherTotalAttrs: Dict<number> = edges.reduce((total: Dict<number>, edge: E) => {
    if(!isConnectedToCentralNode(edge)) total = DictUtils.sumDicts(total, getEdgeAttrs(edge));

    return total;
  }, {});

  const targetProportion: number = MAX_PROPORTION *  magnitude;
  const curProportions: Dict<number> = DictUtils.divideDictsIgnore0(centralTotalAttrs, otherTotalAttrs);
  const multipliers: Dict<number> = DictUtils.divideScalarDictIgnore0(targetProportion, curProportions);

  return edges.map((edge: E) => {
    // 1. Modify 'central' edges
    if(isConnectedToCentralNode(edge)) {
      // 1.1. Get numeric attributes
      const edgeAttrs: Dict<number> = getEdgeAttrs(edge);
      // 1.2. Apply multiplier
      const modifiedEdgeAttrs: Dict<number> = DictUtils.multiplyDicts(edgeAttrs, multipliers);

      return {
        ...edge,
        ...modifiedEdgeAttrs,
      };

    }
    // 2. Return untouched 'other' edges
    else return { ...edge };
  });
}
