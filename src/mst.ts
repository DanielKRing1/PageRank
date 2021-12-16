// import Heap from 'heap';

// import { Dict } from './types';

// function getMST<T>(originEntity: T, getId: (entity: T) => string, getConnectedNodes: (originEntity: T) => T[], getDistance: (entity: T) => number, maxDepth = Number.POSITIVE_INFINITY) {
//   const mst: Dict<number> = {};
//   // Min-heap prioritizing smaller distances in MST
//   const minHeap = new Heap((a: T, b: T) => mst[getId(a)] - mst[getId(b)]);

//   // Util methods
//   const alreadyExplored = (entity: T): boolean => mst.hasOwnProperty(getId(entity));

//   const exploreDestination = (destinationEntity: T, newDistance: number) => {
//     const destinationId = getId(destinationEntity);

//     if (alreadyExplored(destinationEntity)) {
//       const curDistance = mst[destinationId];
//       if (curDistance > newDistance) {
//         mst[destinationId] = newDistance;
//         // Check if in heap, do not add back in
//         minHeap.updateItem(destinationEntity);
//       }
//     } else {
//       mst[destinationId] = newDistance;
//       minHeap.push(destinationEntity);
//     }
//   };

//   // 1. Explore starting point
//   exploreDestination(originEntity, 0);

//   let iterations = 0;
//   while (!minHeap.empty() && iterations <= maxDepth) {
//     // 2. Get closest entity
//     const closestEntity = minHeap.pop();
//     const closestEntityId = getId(closestEntity);

//     // 3. Explore all of its connected entities
//     const curDist = mst[closestEntityId];
//     const connectedNodes: T[] = getConnectedNodes(closestEntity);
//     for (const destinationEntity of connectedNodes) {
//       const destinationDist: number = getDistance(destinationEntity);
//       const totalDist: number = curDist + destinationDist;

//       exploreDestination(destinationEntity, totalDist);
//     }

//     iterations++;
//   }

//   console.log(iterations);

//   return mst;
// }

// const graph = {
//   A: {
//     C: 2,
//     H: 1,
//     F: 5,
//     G: 6,
//   },
//   C: {
//     A: 2,
//     F: 5,
//     G: 6,
//   },
//   F: {
//     A: 5,
//     C: 5,
//     H: 1,
//   },
//   G: {
//     A: 6,
//     C: 6,
//     H: 2,
//   },
//   H: {
//     A: 1,
//     F: 1,
//     G: 2,
//     I: 1,
//   },
//   I: {
//     H: 1,
//     J: 1,
//   },
//   J: {
//     I: 1,
//     F: 1,
//     G: 2,
//   },
// };

// const getId = (entityId: string): string => entityId;
// type ConnectedEntity<T> = {
//   entity: T;
//   distance: number;
// };
// const getConnectedEntities = (entityId: string): ConnectedEntity[] =>
//   Object.keys(graph[entityId]).map((destinationId) => ({
//     entity: destinationId,
//     distance: graph[entityId][destinationId],
//   }));

// const getId1 = (entity) => entity.name;
// const getConnectedEntities3 = (entity) =>
//   closestEntity.relationships.map((rel) => ({
//     entity: rel.entities.filtered(`name != ${closestEntityId}`)[0],
//     distance: rel.distance,
//   }));

// console.log('MST');
// console.log(getMST('A', getId, getConnectedEntities));
