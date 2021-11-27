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
exports.__esModule = true;
exports.redistributeWeight = exports.getInitialWeights = exports.pageRank = void 0;
var DictUtil = require("../dictionary/Operations");
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
function pageRank(initialMap, allNodes, getNodeId, getEdges, getEdgeAttrs, getDestinationNode, iterations, dampingFactor, curIteration) {
    if (dampingFactor === void 0) { dampingFactor = 0.85; }
    if (curIteration === void 0) { curIteration = 0; }
    console.log("Iteration " + curIteration);
    console.log(initialMap);
    var weightMap = {};
    // 1. For each node
    for (var _i = 0, allNodes_1 = allNodes; _i < allNodes_1.length; _i++) {
        var node = allNodes_1[_i];
        var nodeId = getNodeId(node);
        // 1.1. Get node's edges
        var nodeEdges = getEdges(node);
        var allNodeEdgeAttrs = nodeEdges.map(function (nodeEdge) { return getEdgeAttrs(nodeEdge); });
        // 1.2. Get sum of all node's edges
        var summedNodeEdgeAttrs = DictUtil.sumDicts.apply(DictUtil, allNodeEdgeAttrs);
        // 2. For each of node's edges
        for (var _a = 0, nodeEdges_1 = nodeEdges; _a < nodeEdges_1.length; _a++) {
            var nodeEdge = nodeEdges_1[_a];
            // 2.1. Get edge's destination node
            var destinationNode = getDestinationNode(node, nodeEdge);
            var destinationId = getNodeId(destinationNode);
            // 3. Get weight of the current edge, relative to the node's other edges
            var curEdgeAttrs = getEdgeAttrs(nodeEdge);
            var curEdgeWeights = DictUtil.divideDicts(curEdgeAttrs, summedNodeEdgeAttrs);
            // 4. Partition some of the current node's total weight for the current edge's destination node
            var curNodeAttrs = initialMap[nodeId];
            var destinationNodeAddendWeights = DictUtil.multiplyDicts(curNodeAttrs, curEdgeWeights);
            // 5. Add product of the current node weight and the current edge weight to the destination node
            // Sum of all entries in weightMap should equal 1
            weightMap[destinationId] = DictUtil.sumDicts(weightMap[destinationId], destinationNodeAddendWeights);
        }
    }
    // 6. Apply damping factor to weightMap:
    //      - Tax some fraction of weight, d, from each node
    //      - Refund (1 - d) / N weight to each node in the graph
    //      This essentially reduces the gap between popular and unpopular nodes by taking from the rich and redistributing equally to all (including the rich)
    var weightToRedistribute = (1 - dampingFactor) / allNodes.length;
    for (var nodeKey in weightMap) {
        var nodeAttrWeights = weightMap[nodeKey];
        // Take from the rich (Taxes all, but taxing affects 'the rich' more than the poor)
        var taxedAttrWeights = DictUtil.multiplyDictScalar(nodeAttrWeights, dampingFactor);
        // Refund to the poor (Refunds to all, but refunding affects 'the poor' more than the rich)
        var refundedAttrWeights = DictUtil.sumDictScalar(taxedAttrWeights, weightToRedistribute);
        weightMap[nodeKey] = refundedAttrWeights;
    }
    return curIteration < iterations ? pageRank(weightMap, allNodes, getNodeId, getEdges, getEdgeAttrs, getDestinationNode, iterations, dampingFactor, curIteration + 1) : weightMap;
}
exports.pageRank = pageRank;
function getInitialWeights(allNodes, getNodeId, getNodeAttrs) {
    // 1.1. Get each node's attributes
    var allNodeAttrs = [];
    for (var _i = 0, allNodes_2 = allNodes; _i < allNodes_2.length; _i++) {
        var node = allNodes_2[_i];
        var nodeAttrs = getNodeAttrs(node);
        allNodeAttrs.push(nodeAttrs);
    }
    // 1.2. Compute total summed node attributes
    var summedNodeAttrs = DictUtil.sumDicts.apply(DictUtil, allNodeAttrs);
    console.log('1');
    console.log('SUMMED NODE ATTRS');
    console.log(summedNodeAttrs);
    // 2.1. Get each node's attributes
    var weightMap = {};
    for (var _a = 0, allNodes_3 = allNodes; _a < allNodes_3.length; _a++) {
        var node = allNodes_3[_a];
        var nodeAttrs = getNodeAttrs(node);
        var weightedNodeAttrs = DictUtil.divideDicts(nodeAttrs, summedNodeAttrs);
        // 2. Compute node's weighted edge attributes for each node: weighted node attrs = (node's attrs) / (total summed attrs)
        var nodeId = getNodeId(node);
        weightMap[nodeId] = weightedNodeAttrs;
    }
    return weightMap;
}
exports.getInitialWeights = getInitialWeights;
function redistributeWeight(initialWeights, targetCentralWeight, keysToRedistributeTo) {
    // 1. Get "central" weights (in keysToRedistributeTo)
    var centralNodes = DictUtil.copyDictKeep(initialWeights, keysToRedistributeTo);
    var centralNodeCount = Object.keys(centralNodes).length;
    // 2. Get "other" weights (not in keysToRedistributeTo)
    var otherNodes = DictUtil.copyDictRm(initialWeights, keysToRedistributeTo);
    var otherNodeCount = Object.keys(otherNodes).length;
    // 3. Sum "central" weights and determine what percentage of weight to redistribute to these central nodes
    var summedCentralWeights = DictUtil.sumDicts.apply(DictUtil, Object.values(centralNodes));
    var missingWeights = DictUtil.subScalarDict(targetCentralWeight, summedCentralWeights);
    // Clamp min to 0
    var totalWeightToRedistribute = DictUtil.mutateDict(missingWeights, function (key, value) { return Math.max(0, value); });
    var individualWeightToRedistribute = DictUtil.divideDictScalar(totalWeightToRedistribute, otherNodeCount);
    // 4. Evenly subtract out this percentage from each of the "other" weights
    var dehydratedOtherWeights = DictUtil.mutateDict(otherNodes, function (key, attrDict) {
        return DictUtil.subDicts(attrDict, individualWeightToRedistribute);
    });
    // 5. Unevenly add in this percentage to the "central" weights
    var hydratedCentralWeights = DictUtil.mutateDict(centralNodes, function (key, nodeAttrs) {
        var hydratedWeights = {};
        // 5.1. For each central node
        for (var attrKey in nodeAttrs) {
            var attrVal = nodeAttrs[attrKey];
            // 5.2. Compute the weight of each central node, relative to the other central nodes
            var totalWeight = totalWeightToRedistribute[attrKey];
            var nodeWeight = attrVal / summedCentralWeights[attrKey];
            // The weight to redistribute is not equally redistributed among "central" nodes: Central nodes with higher starting weight get a larger cut
            var earnedWeight = totalWeight * nodeWeight;
            hydratedWeights[attrKey] = attrVal + earnedWeight;
        }
        return hydratedWeights;
    });
    return __assign(__assign({}, dehydratedOtherWeights), hydratedCentralWeights);
}
exports.redistributeWeight = redistributeWeight;
