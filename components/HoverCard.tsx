"use client";

import { TagPill } from "./TagPill";
import type { GraphNodeView } from "./Graph";

export function HoverCard({
  node,
  x,
  y,
}: {
  node: GraphNodeView;
  x: number;
  y: number;
}) {
  // Clamp position so the card stays inside the viewport.
  const clampedX = Math.min(Math.max(x + 12, 8), window.innerWidth - 320);
  const clampedY = Math.min(Math.max(y + 12, 8), window.innerHeight - 200);

  return (
    <div
      className="fixed z-40 pointer-events-none w-[300px] bg-white border border-[var(--border)] rounded shadow-md p-3"
      style={{ left: clampedX, top: clampedY }}
    >
      <h3 className="text-sm font-medium leading-tight mb-1.5">
        {node.title}
      </h3>
      {node.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {node.tags.slice(0, 6).map((t) => (
            <TagPill key={t} tag={t} />
          ))}
        </div>
      )}
      {node.preview && (
        <p className="text-xs text-[var(--muted)] line-clamp-3">
          {node.preview}
        </p>
      )}
    </div>
  );
}
