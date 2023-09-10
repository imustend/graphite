import { Dispatch, MutableRefObject, SetStateAction, useCallback, useEffect, useRef } from "react";
import { Graph, Vertex } from "~/core/simulator/graph";
import { Arrangement } from "../types/arrangement";
import { SelectedVertex } from "../types/selectedVertex";
import { Vec2 } from "../types/vec2";

type ForceSimulatorSettings = {
  threshold: number;
  coolingFactor: number;
};

type Context = {
  chilled: boolean;
  ignore: Set<string>;
};

const defaultForceSimulatorSettings: ForceSimulatorSettings = {
  threshold: 0.01,
  coolingFactor: 0.99,
};

class ForceSimulator {
  settings: ForceSimulatorSettings = defaultForceSimulatorSettings;

  // TODO: These variables could be extracted to some config that is passed to simulator.
  maxForce = 0.4;

  attractiveTargetLength = 100; // Target connection length
  attractiveStrength = 0.025;
  attractiveStrengthChilled = 0.001;

  repulsiveStrength = 100;
  repulsiveChillOut = 0.05;
  repulsiveStrengthChilled = 10;

  constructor(settings: Partial<ForceSimulatorSettings> = {}) {
    this.settings = { ...this.settings, ...settings };
  }

  applyForces = (context: Context, graph: Graph, oldArrangement: Arrangement): Arrangement => {
    const { threshold, coolingFactor } = this.settings;
    const { ignore } = context;

    const vertices = Object.values(graph.vertices);
    const arrangement: Arrangement = { ...oldArrangement };
    const forces: Record<string, Vec2> = {};

    let maxForce = 0;

    for (const vertex of vertices) {
      if (ignore.has(vertex.id)) {
        forces[vertex.id] = new Vec2(0, 0);
        continue;
      }

      const repulsiveForce = this.computeRepulsiveForce(context, vertex, vertices, arrangement);
      const attractiveForce = this.computeAttractiveForce(context, vertex, graph, arrangement);
      forces[vertex.id] = new Vec2(0, 0)
        .add(repulsiveForce)
        .add(attractiveForce)
        .add(this.boundingCircleForce(arrangement[vertex.id]));

      const force = forces[vertex.id].len();
      if (force > maxForce) {
        maxForce = force;
      }
    }

    if (maxForce < threshold) {
      return oldArrangement;
    }

    for (const vertex of vertices) {
      const finalForce = forces[vertex.id].multiply(coolingFactor);
      arrangement[vertex.id].add(finalForce);
    }

    return arrangement;
  };

  computeRepulsiveForce(
    context: Context,
    vertex: Vertex,
    vertices: Vertex[],
    arrangement: Arrangement
  ): Vec2 {
    const totalForce = new Vec2(0, 0);

    for (const currentVertex of vertices) {
      if (currentVertex.id === vertex.id) {
        continue;
      }

      const force = this.repulsiveForce(
        context,
        arrangement[vertex.id],
        arrangement[currentVertex.id]
      );

      totalForce.add(force);
    }

    return totalForce;
  }

  computeAttractiveForce(
    context: Context,
    vertex: Vertex,
    graph: Graph,
    arrangement: Arrangement
  ): Vec2 {
    const processedEdges = new Set<string>();
    const totalForce = new Vec2(0, 0);
    const adjacentEdges = [...vertex.ins, ...vertex.outs];

    for (const edgeId of adjacentEdges) {
      if (processedEdges.has(edgeId)) {
        continue;
      }

      const edge = graph.edges[edgeId];
      const adjacentVertexId = edge.to === vertex.id ? edge.from : edge.to;

      if (vertex.id === adjacentVertexId) {
        continue;
      }

      const force = this.attractiveForce(
        context,
        arrangement[vertex.id],
        arrangement[adjacentVertexId]
      );

      processedEdges.add(edgeId);
      totalForce.add(force);
    }

    return totalForce;
  }

  repulsiveForce({ chilled }: Context, source: Vec2, adj: Vec2): Vec2 {
    const forceChillOut = this.repulsiveChillOut;
    const forceStrength = chilled ? this.repulsiveStrengthChilled : this.repulsiveStrength;

    const force = Math.min(
      forceStrength / (1 + Math.pow(Math.E, forceChillOut * source.distanceTo(adj))),
      this.maxForce
    );

    return adj.vecTo(source).multiply(force * 10);
  }

  attractiveForce({ chilled }: Context, source: Vec2, adj: Vec2): Vec2 {
    const targetLength = this.attractiveTargetLength;
    const strength = chilled ? this.attractiveStrengthChilled : this.attractiveStrength;

    const force = Math.min(
      strength * Math.log(adj.distanceTo(source) / targetLength),
      this.maxForce
    );

    return source.vecTo(adj).multiply(force * 300);
  }

  boundingCircleForce(source: Vec2): Vec2 {
    const distance = source.distanceTo(new Vec2(0, 0));
    const force = Math.min(1 / (1 + Math.pow(Math.E, (1 / 100) * -distance + 17)), 0.1);
    return source.vecTo(new Vec2(0, 0)).multiply(force);
  }
}

const forceSimulator = new ForceSimulator();

export function useForceSimulation(
  graph: Graph,
  selectedVertexRef: MutableRefObject<SelectedVertex | undefined>,
  chilled: boolean,
  setArrangement: Dispatch<SetStateAction<Arrangement>>
) {
  const frameRef = useRef<number>();

  const runSimulation: FrameRequestCallback = useCallback(() => {
    const selectedVertex = selectedVertexRef.current;

    setArrangement((current) => {
      const context: Context = {
        chilled,
        ignore: new Set(selectedVertex ? [selectedVertex.id] : []),
      };

      return forceSimulator.applyForces(context, graph, current);
    });

    frameRef.current = requestAnimationFrame(runSimulation);
  }, [chilled, graph, setArrangement, selectedVertexRef]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(runSimulation);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [runSimulation]);
}
