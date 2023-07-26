import { useState } from "react";
import { algorithms } from "~/algorithms";
import { Algorithm } from "~/types/algorithm";
import { AlgorithmDetails } from "./AlgorithmDetails";
import { AlgorithmGrid } from "./AlgorithmGrid";

export const AlgorithmPicker = () => {
  const [browsedAlgorithm, setBrowsedAlgorithm] =
    useState<Algorithm<unknown>>();

  return (
    <div className="h-full w-full bg-slate-50">
      {browsedAlgorithm ? (
        <AlgorithmDetails
          algorithm={browsedAlgorithm}
          onBack={() => setBrowsedAlgorithm(undefined)}
        />
      ) : (
        <AlgorithmGrid
          algorithms={algorithms}
          onAlgorithmSelect={setBrowsedAlgorithm}
        />
      )}
    </div>
  );
};
