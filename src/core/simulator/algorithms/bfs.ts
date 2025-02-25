/* eslint-disable @typescript-eslint/no-non-null-assertion */

import type { Algorithm } from "~/core/simulator/algorithm";
import { Graph } from "~/core/simulator/graph";
import type { Highlights } from "../highlight";
import { StepBuilder, type Step } from "../step";
import { ArrayStateBuilder } from "../state";

function buildVisitOrderState(visited: string[]) {
  return new ArrayStateBuilder({ title: "Visit Order" }).data(visited).build();
}

function buildQueueState(stack: string[], highlighted: number[] = []) {
  return new ArrayStateBuilder({ title: "Queue" })
    .data(stack)
    .highlighted(new Set(highlighted))
    .build();
}

function visitedHighlights(visited: Set<string>): Highlights {
  return new Map([...visited].map((id) => [id, "slate"]));
}

function algorithm(graph: Graph, startingVertex: string): Step[] {
  const steps: Step[] = [];
  const visited = new Set<string>();
  const stack: string[] = [];

  stack.push(startingVertex);

  steps.push(
    new StepBuilder({
      description: `Push start vertex ${startingVertex} to the queue.`,
    })
      .state([buildQueueState([...stack], [stack.length - 1]), buildVisitOrderState([...visited])])
      .verticesHighlights(new Map([[startingVertex, "sky"]]))
      .build()
  );

  while (stack.length !== 0) {
    const currentId = stack.shift()!;
    const current = graph.vertices[currentId]!;

    steps.push(
      new StepBuilder({
        description: `Get first vertex ${currentId} from the queue.`,
      })
        .state([buildQueueState([currentId, ...stack], [0]), buildVisitOrderState([...visited])])
        .verticesHighlights(new Map([[currentId, "sky"], ...visitedHighlights(visited)]))
        .build()
    );

    if (visited.has(currentId)) {
      steps.push(
        new StepBuilder({
          description: `Vertex ${currentId} was already visited. Continue to the next step.`,
        })
          .state([buildQueueState([...stack]), buildVisitOrderState([...visited])])
          .verticesHighlights(new Map([[currentId, "slate"], ...visitedHighlights(visited)]))
          .build()
      );

      continue;
    }

    visited.add(current.id);

    steps.push(
      new StepBuilder({
        description: `Mark vertex ${currentId} as visited.`,
      })
        .state([buildQueueState([...stack]), buildVisitOrderState([...visited])])
        .verticesHighlights(new Map([[current.id, "slate"], ...visitedHighlights(visited)]))
        .build()
    );

    const outsHighlights: Highlights = new Map();
    const addedIndexes = [];

    for (const edgeId of current.outs) {
      const edge = graph.edges[edgeId];
      const adjacentId = edge.to === current.id && !edge.directed ? edge.from : edge.to;

      if (visited.has(adjacentId)) {
        continue;
      }

      addedIndexes.push(stack.length);
      stack.push(adjacentId);
      outsHighlights.set(adjacentId, "sky");
    }

    steps.push(
      new StepBuilder({
        description: "Push all adjacent vertices to the queue.",
      })
        .state([buildQueueState([...stack], addedIndexes), buildVisitOrderState([...visited])])
        .verticesHighlights(
          new Map([[current.id, "orange"], ...outsHighlights, ...visitedHighlights(visited)])
        )
        .build()
    );
  }

  steps.push(
    new StepBuilder({
      description: "There is no more vertices in the queue. End the algorithm.",
    })
      .state([buildQueueState([...stack]), buildVisitOrderState([...visited])])
      .verticesHighlights(visitedHighlights(visited))
      .build()
  );

  return steps;
}

export interface IterativeBFSAlgorithmParams {
  "Start Vertex": string;
}

export const bfs: Algorithm<IterativeBFSAlgorithmParams> = {
  name: "Breath First Search",
  description: "See how BFS explores vertices in your graph.",
  tags: ["exploration"],
  guide: `
  **BFS** algorithm is a traversal algorithm that explores all vertices at the present depth prior to moving on to the vertices at the next depth level.
  Iterative version uses a queue to maintain the correct visit order.

  \`\`\`
   1  procedure BFS(G, root) is
   2      let Q be a queue
   3      label root as explored
   4      Q.enqueue(root)
   5      while Q is not empty do
   6          v := Q.dequeue()
   7          if v is the goal then
   8              return v
   9          for all edges from v to w in G.adjacentEdges(v) do
  10              if w is not labeled as explored then
  11                  label w as explored
  12                  Q.enqueue(w)
  \`\`\`
  source: https://en.wikipedia.org/wiki/Breadth-first_search
`,
  params: {
    "Start Vertex": { type: "vertex", required: true },
  },
  stepGenerator(graph, params) {
    return algorithm(graph, params["Start Vertex"]);
  },
};
