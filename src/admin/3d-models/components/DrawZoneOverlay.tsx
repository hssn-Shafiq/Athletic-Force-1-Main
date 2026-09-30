import React, { useState, useRef } from "react";
import { DrawRect } from "../types";

interface DrawZoneOverlayProps {
  canvasRef: React.RefObject<HTMLDivElement | null>;
  isDrawing: boolean;
  onRectDrawn: (rect: DrawRect) => void;
  onCancel: () => void;
}

export function DrawZoneOverlay({
  canvasRef,
  isDrawing,
  onRectDrawn,
}: DrawZoneOverlayProps) {
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  const getRelative = (e: React.MouseEvent) => {
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    isDragging.current = true;
    const pos = getRelative(e);
    setStart(pos);
    setCurrent(pos);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !isDrawing) return;
    setCurrent(getRelative(e));
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current || !isDrawing || !start) return;
    isDragging.current = false;
    const end = getRelative(e);
    const el  = canvasRef.current;
    if (!el) return;
    const cw = el.clientWidth;
    const ch = el.clientHeight;

    const rx = Math.min(start.x, end.x);
    const ry = Math.min(start.y, end.y);
    const rw = Math.abs(end.x - start.x);
    const rh = Math.abs(end.y - start.y);

    if (rw < 10 || rh < 10) {
      // Too small — cancel
      setStart(null);
      setCurrent(null);
      return;
    }

    onRectDrawn({ x: rx / cw, y: ry / ch, w: rw / cw, h: rh / ch });
    setStart(null);
    setCurrent(null);
  };

  if (!isDrawing) return null;

  const rect = start && current ? {
    left:   Math.min(start.x, current.x),
    top:    Math.min(start.y, current.y),
    width:  Math.abs(current.x - start.x),
    height: Math.abs(current.y - start.y),
  } : null;

  return (
    <div
      className="absolute inset-0 z-20 select-none"
      style={{ cursor: "crosshair" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/20 pointer-events-none" />

      {/* Live rectangle */}
      {rect && rect.width > 5 && rect.height > 5 && (
        <div
          className="absolute border-2 border-orange-400 bg-orange-400/10 pointer-events-none"
          style={{
            left:   rect.left,
            top:    rect.top,
            width:  rect.width,
            height: rect.height,
          }}
        >
          <div className="absolute -top-5 left-0 text-[9px] text-orange-300 font-black whitespace-nowrap">
            {Math.round(rect.width)}×{Math.round(rect.height)}px
          </div>
          {/* Corner handles */}
          {[
            "top-0 left-0 -translate-x-1/2 -translate-y-1/2",
            "top-0 right-0 translate-x-1/2 -translate-y-1/2",
            "bottom-0 left-0 -translate-x-1/2 translate-y-1/2",
            "bottom-0 right-0 translate-x-1/2 translate-y-1/2",
          ].map((cls, i) => (
            <div key={i} className={`absolute w-2 h-2 bg-orange-400 rounded-full ${cls}`} />
          ))}
        </div>
      )}
    </div>
  );
}
