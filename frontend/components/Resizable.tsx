import { useState, useRef } from "react";

export default function ResizableLayout({
  LeftPanel,
  MiddlePanel,
  RightPanel,
}: {
  LeftPanel: React.ReactNode;
  MiddlePanel: React.ReactNode;
  RightPanel: React.ReactNode;
}) {
  const [leftWidth, setLeftWidth] = useState(500); // initial px width
  const [middleWidth, setMiddleWidth] = useState(700); // initial px width
  const containerRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef<null | "left" | "right">(null);

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - containerRect.left;

    if (isDragging.current === "left") {
      setLeftWidth(Math.min(Math.max(offsetX, 200), 500)); // min 200, max 500
    } else if (isDragging.current === "right") {
      const middleEnd = leftWidth + middleWidth;
      const newMiddle = Math.min(Math.max(offsetX - leftWidth, 300), 800);
      setMiddleWidth(newMiddle);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = null;
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  const startDragging = (side: "left" | "right") => {
    isDragging.current = side;
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div ref={containerRef} className="flex h-full w-full relative">
      <div style={{ width: leftWidth }} className="h-full overflow-hidden">
        {LeftPanel}
      </div>

      {/* Resizer between Left and Middle */}
      <div
        onMouseDown={() => startDragging("left")}
        className="w-1 bg-gray-300 cursor-col-resize z-50"
      />

      <div style={{ width: middleWidth }} className="h-full overflow-hidden">
        {MiddlePanel}
      </div>

      {/* Resizer between Middle and Right */}
      <div
        onMouseDown={() => startDragging("right")}
        className="w-1 bg-gray-300 cursor-col-resize z-50"
      />

      <div className="flex-1 h-full overflow-hidden">{RightPanel}</div>
    </div>
  );
}
