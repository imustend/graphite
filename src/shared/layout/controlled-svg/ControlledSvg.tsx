import {
  Dispatch,
  ReactNode,
  RefObject,
  SetStateAction,
  forwardRef,
  useRef,
} from "react";
import { combineRefs } from "~/features/graph-view/helpers/combineRefs";
import { useResizeObserver } from "./hooks/useResizeObserver";
import { Position, useSvgControls } from "./hooks/useSvgControls";

export type ControllableSvgControls = (
  zoom: number,
  center: Position,
  setZoom: Dispatch<SetStateAction<number>>,
  setCenter: Dispatch<SetStateAction<Position>>
) => ReactNode;

export interface ControllableSvgProps {
  controls?: ControllableSvgControls;
  children?: ReactNode;
  isZoomEnabled?: RefObject<boolean>;
  isPanEnabled?: RefObject<boolean>;
}

export const ControlledSvg = forwardRef<SVGSVGElement, ControllableSvgProps>(
  (props, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    const containerRect = useResizeObserver(containerRef);

    // prettier-ignore
    const { center, setCenter, zoom, setZoom } =
      useSvgControls(svgRef, props.isZoomEnabled, props.isPanEnabled);
    const viewBox = getViewBox(containerRect, center, zoom);

    return (
      <div
        ref={containerRef}
        className="relative h-full w-full select-none overflow-hidden"
      >
        <div className="pointer-events-none absolute left-0 top-0 h-full w-full">
          {props.controls?.(zoom, center, setZoom, setCenter)}
        </div>
        <svg
          ref={combineRefs(svgRef, ref)}
          style={{ width: containerRect.width, height: containerRect.height }}
          className="h-full w-full"
          viewBox={viewBox.join(" ")}
        >
          {props.children}
        </svg>
      </div>
    );
  }
);

export type ViewBox = [x: number, y: number, w: number, h: number];

const getViewBox = (
  containerRect: DOMRect,
  center: Position,
  zoom: number
): ViewBox => {
  const { width: containerWidth, height: containerHeight } = containerRect;

  const viewportWidth = containerWidth / zoom;
  const viewportHeight = containerHeight / zoom;

  const viewportX = -viewportWidth / 2 + center[0];
  const viewportY = -viewportHeight / 2 + center[1];

  return [viewportX, viewportY, viewportWidth, viewportHeight];
};
