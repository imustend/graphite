import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore } from "../context/editor";
import { DynamicSplit } from "~/shared/layout/Split";
import { GraphView } from "../../../features/graph-view/GraphView";
import { useLayoutSettingsStore } from "../store/layout";
import { ArrayStep } from "./ArrayStep";
import { Player } from "./Player";
import { TableStep } from "./TableStep";
import { State } from "~/core/simulator/state";

export const Visualizer = () => {
  const visualizerRef = useRef(null);
  const orientation = useLayoutSettingsStore(({ orientation }) => orientation);

  const mode = useEditorStore(({ mode }) => mode);
  const graph = useEditorStore(({ graph }) => graph);
  const [currentStepIndex, setCurrentStep] = useState(0);

  // TODO: We might want to do this differently
  useEffect(() => {
    setCurrentStep(0);
  }, [mode]);

  const labels =
    mode.type === "SIMULATION" ? mode.steps[currentStepIndex]?.labels : new Map<string, string>();
  const verticesHighlights =
    mode.type === "SIMULATION" ? mode.steps[currentStepIndex]?.verticesHighlights : undefined;
  const edgesHighlights =
    mode.type === "SIMULATION" ? mode.steps[currentStepIndex]?.edgesHighlights : undefined;

  const renderStepState = useCallback((state: State) => {
    if (!state) return null;

    switch (state.type) {
      case "table":
        return <TableStep state={state} />;
      case "array": {
        return <ArrayStep state={state} />;
      }
      default:
        return null;
    }
  }, []);

  return (
    <div className="relative h-full w-full" ref={visualizerRef}>
      <DynamicSplit
        orientation={orientation}
        active={mode.type === "SIMULATION"}
        staticPane={
          <GraphView
            graph={graph}
            labels={labels}
            verticesHighlights={verticesHighlights}
            edgesHighlights={edgesHighlights}
          />
        }
        initialShare={100 * (2 / 3)}
        dynamicPane={
          mode.type === "SIMULATION" && (
            <div className="flex h-full w-full min-w-[350px] flex-col">
              <Player
                className="flex-shrink-0 border-b border-slate-300"
                currentStep={currentStepIndex}
                onStepChange={setCurrentStep}
                numberOfSteps={mode.steps.length - 1}
                settings={{
                  speed: 1000,
                }}
              />
              <div className="flex min-h-[150px] flex-col gap-1 border-b border-slate-300 p-4">
                <span className="font-bold text-slate-800">
                  Step {currentStepIndex + 1} / {mode.steps.length}
                </span>
                <p className="text-slate-800">
                  {mode.steps[currentStepIndex] && mode.steps[currentStepIndex].description}
                </p>
              </div>
              {mode.steps[currentStepIndex] &&
                mode.steps[currentStepIndex].state.map((s, i) => (
                  <div key={i} className="border-b border-slate-300">
                    {renderStepState(s)}
                  </div>
                ))}
            </div>
          )
        }
      />
    </div>
  );
};
