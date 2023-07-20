import { useEffect, useRef, useState } from "react";
import { BottomPane } from "~/shared/layout/BottomPane";
import { VerticalSplit } from "~/shared/layout/VerticalSplit";
import { useEditorStore } from "../context/editor";
import { GraphView } from "../features/graph-view/GraphView";
import { StepStateTable } from "./StepStateTable";
import { Timeline } from "./Timeline";
import { AlgorithmControls } from "./AlgorithmControls";

export const Visualizer = () => {
  const visualizerRef = useRef(null);

  const [currentStepIndex, setCurrentStep] = useState(0);

  const { mode, graph } = useEditorStore(({ mode, graph }) => ({
    mode,
    graph,
  }));

  // TODO: We might want to do this differently
  useEffect(() => {
    setCurrentStep(0);
  }, [mode]);

  const highlights =
    mode.type === "SIMULATION"
      ? mode.steps[currentStepIndex].highlights
      : undefined;

  return (
    <div className="relative flex h-full w-full flex-col" ref={visualizerRef}>
      <GraphView
        graph={graph}
        className="h-full w-full"
        highlights={highlights}
      />

      {mode.type === "SIMULATION" && (
        <BottomPane parentRef={visualizerRef}>
          <div className="flex h-full w-full flex-col divide-y divide-slate-300">
            <AlgorithmControls
              currentStep={currentStepIndex}
              onStepChange={setCurrentStep}
              numberOfSteps={mode.steps.length}
              playerSettings={{
                speed: 1.5 * 1000,
              }}
            />
            <VerticalSplit
              left={
                <div className="flex flex-col gap-1 p-4">
                  <span className="font-bold text-slate-800">
                    Step {currentStepIndex + 1} / {mode.steps.length}
                  </span>
                  <p className="text-slate-800">
                    {mode.steps[currentStepIndex].description}
                  </p>
                </div>
              }
              right={
                <StepStateTable state={mode.steps[currentStepIndex].state} />
              }
            />
          </div>
        </BottomPane>
      )}
    </div>
  );
};
