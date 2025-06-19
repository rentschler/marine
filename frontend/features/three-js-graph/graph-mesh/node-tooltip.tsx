import { Tooltip } from "@heroui/react";
import { JSX } from "react";


export type NodeTooltipProps = {
    visible: boolean,
    label: string,
    x: number,
    y: number
}


export function NodeTooltip(props: NodeTooltipProps) {
  const { visible, label, x, y } = props;

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: x,
        top: y + 10,
        transform: "translate(-50%, 10px)",
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      <Tooltip
        isOpen
        content={renderMultilineTooltip(label)}
        placement="top"
      >
        <span style={{ visibility: "hidden" }}>.</span>
      </Tooltip>
    </div>
  );
}

function renderMultilineTooltip(label: string): JSX.Element {
  return (
    <div style={{ maxWidth: "400px", textAlign: "left", whiteSpace: "pre-wrap" }}>
      {label.split("\n").map((line, idx) => (
        <div key={idx}>{line}</div>
      ))}
    </div>
  );
}

