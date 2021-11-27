import {current} from '@reduxjs/toolkit';
import * as DictUtil from '../dictionary/Operations';

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
  console.log(`Iteration ${curIteration}`);
  console.log(initialMap);

  let weightMap: Dict<Dict<number>> = {};

  // 1. For each node
  for (const node of allNodes) {
    const nodeId: string = getNodeId(node);

    // 1.1. Get node's edges
    const nodeEdges: E[] = getEdges(node);
    const allNodeEdgeAttrs: Dict<number>[] = nodeEdges.map((nodeEdge: E) => getEdgeAttrs(nodeEdge));
    // 1.2. Get sum of all node's edges
    const summedNodeEdgeAttrs: Dict<number> = DictUtil.sumDicts(...allNodeEdgeAttrs);

    // 2. For each of node's edges
    for (const nodeEdge of nodeEdges) {
      // 2.1. Get edge's destination node
      const destinationNode: N = getDestinationNode(node, nodeEdge);
      const destinationId: string = getNodeId(destinationNode);

      // 3. Get weight of the current edge, relative to the node's other edges
      const curEdgeAttrs: Dict<number> = getEdgeAttrs(nodeEdge);
      const curEdgeWeights: Dict<number> = DictUtil.divideDicts(curEdgeAttrs, summedNodeEdgeAttrs);

      // 4. Partition some of the current node's total weight for the current edge's destination node
      const curNodeAttrs: Dict<number> = initialMap[nodeId];
      const destinationNodeAddendWeights: Dict<number> = DictUtil.multiplyDicts(curNodeAttrs, curEdgeWeights);

      // 5. Add product of the current node weight and the current edge weight to the destination node
      // Sum of all entries in weightMap should equal 1
      weightMap[destinationId] = DictUtil.sumDicts(weightMap[destinationId], destinationNodeAddendWeights);
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
    const taxedAttrWeights: Dict<number> = DictUtil.multiplyDictScalar(nodeAttrWeights, dampingFactor);
    // Refund to the poor (Refunds to all, but refunding affects 'the poor' more than the rich)
    const refundedAttrWeights: Dict<number> = DictUtil.sumDictScalar(taxedAttrWeights, weightToRedistribute);

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
  const summedNodeAttrs: Dict<number> = DictUtil.sumDicts(...allNodeAttrs);

  console.log('1');
  console.log('SUMMED NODE ATTRS');
  console.log(summedNodeAttrs);

  // 2.1. Get each node's attributes
  let weightMap: Dict<Dict<number>> = {};
  for (const node of allNodes) {
    const nodeAttrs: Dict<number> = getNodeAttrs(node);
    const weightedNodeAttrs: Dict<number> = DictUtil.divideDicts(nodeAttrs, summedNodeAttrs);

    // 2. Compute node's weighted edge attributes for each node: weighted node attrs = (node's attrs) / (total summed attrs)
    const nodeId: string = getNodeId(node);
    weightMap[nodeId] = weightedNodeAttrs;
  }

  return weightMap;
}

export function redistributeWeight(initialWeights: Dict<Dict<number>>, targetCentralWeight: number, keysToRedistributeTo: string[]) {
  // 1. Get "central" weights (in keysToRedistributeTo)
  const centralNodes: Dict<Dict<number>> = DictUtil.copyDictKeep<Dict<number>>(initialWeights, keysToRedistributeTo);
  const centralNodeCount = Object.keys(centralNodes).length;

  // 2. Get "other" weights (not in keysToRedistributeTo)
  const otherNodes: Dict<Dict<number>> = DictUtil.copyDictRm<Dict<number>>(initialWeights, keysToRedistributeTo);
  const otherNodeCount = Object.keys(otherNodes).length;

  // 3. Sum "central" weights and determine what percentage of weight to redistribute to these central nodes
  const summedCentralWeights: Dict<number> = DictUtil.sumDicts(...Object.values(centralNodes));
  const missingWeights: Dict<number> = DictUtil.subScalarDict(targetCentralWeight, summedCentralWeights);
  // Clamp min to 0
  const totalWeightToRedistribute: Dict<number> = DictUtil.mutateDict<number>(missingWeights, (key: string, value: number) => Math.max(0, value));
  const individualWeightToRedistribute: Dict<number> = DictUtil.divideDictScalar(totalWeightToRedistribute, otherNodeCount);

  // 4. Evenly subtract out this percentage from each of the "other" weights
  const dehydratedOtherWeights: Dict<Dict<number>> = DictUtil.mutateDict<Dict<number>>(otherNodes, (key: string, attrDict: Dict<number>) =>
    DictUtil.subDicts(attrDict, individualWeightToRedistribute),
  );

  // 5. Unevenly add in this percentage to the "central" weights
  const hydratedCentralWeights: Dict<Dict<number>> = DictUtil.mutateDict<Dict<number>>(centralNodes, (key: string, nodeAttrs: Dict<number>) => {
    const hydratedWeights: Dict<number> = {};

    // 5.1. For each central node
    for (const attrKey in nodeAttrs) {
      const attrVal = nodeAttrs[attrKey];

      // 5.2. Compute the weight of each central node, relative to the other central nodes
      const totalWeight = totalWeightToRedistribute[attrKey];
      const nodeWeight = attrVal / summedCentralWeights[attrKey];
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
