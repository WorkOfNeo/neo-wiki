"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { primaryColor } from "@/lib/tag-colors";
import { HoverCard } from "./HoverCard";

// react-force-graph-2d touches `window` on import — load it client-side only.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-sm text-[var(--muted)]">
      Loading graph…
    </div>
  ),
});

export interface GraphNodeView {
  id: string;
  title: string;
  tags: string[];
  flavor: "NOTEBOOK" | "DISTILLED";
  size: number;
  preview?: string;
}

interface GraphLinkView {
  source: string | { id: string };
  target: string | { id: string };
  weight: number;
  kind: "semantic" | "explicit";
}

interface GraphData {
  nodes: GraphNodeView[];
  links: GraphLinkView[];
}

function endpointId(end: string | { id: string }): string {
  return typeof end === "string" ? end : end.id;
}

export function Graph({ selectedTags }: { selectedTags: string[] }) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hoverNode, setHoverNode] = useState<GraphNodeView | null>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then((d: GraphData) => setData(d));
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Filter by selected tags (entry must contain ALL selected tags).
  const filtered = useMemo<GraphData | null>(() => {
    if (!data) return null;
    if (selectedTags.length === 0) return data;
    const visible = new Set(
      data.nodes
        .filter((n) => selectedTags.every((t) => n.tags.includes(t)))
        .map((n) => n.id)
    );
    return {
      nodes: data.nodes.filter((n) => visible.has(n.id)),
      links: data.links.filter(
        (l) =>
          visible.has(endpointId(l.source)) &&
          visible.has(endpointId(l.target))
      ),
    };
  }, [data, selectedTags]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      onMouseMove={(e) => setPointer({ x: e.clientX, y: e.clientY })}
    >
      {filtered && size.w > 0 && (
        <ForceGraph2D
          graphData={filtered}
          width={size.w}
          height={size.h}
          backgroundColor="#fafaf9"
          nodeRelSize={5}
          nodeLabel={() => ""}
          linkColor={() => "#c8c6c0"}
          linkWidth={(l) => (l as GraphLinkView).weight * 1.8}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          cooldownTime={3000}
          onNodeHover={(n) => setHoverNode((n as GraphNodeView | null) ?? null)}
          onNodeClick={(node) =>
            router.push(`/entry/${(node as GraphNodeView).id}`)
          }
          nodeCanvasObject={(rawNode, ctx, globalScale) => {
            const node = rawNode as GraphNodeView & { x: number; y: number };
            const r = 3 + Math.sqrt(node.size) * 1.5;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fillStyle = primaryColor(node.tags);
            ctx.fill();
            if (node.flavor === "DISTILLED") {
              ctx.lineWidth = 1.5 / globalScale;
              ctx.strokeStyle = "#1f1f1f";
              ctx.stroke();
            }
            if (globalScale > 1.4) {
              ctx.font = `${11 / globalScale}px ui-sans-serif, system-ui, sans-serif`;
              ctx.fillStyle = "#1f1f1f";
              ctx.textAlign = "center";
              ctx.textBaseline = "top";
              ctx.fillText(node.title, node.x, node.y + r + 2 / globalScale);
            }
          }}
          nodePointerAreaPaint={(rawNode, color, ctx) => {
            const node = rawNode as GraphNodeView & { x: number; y: number };
            const r = 3 + Math.sqrt(node.size) * 1.5;
            ctx.beginPath();
            ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
          }}
          onBackgroundClick={() => setHoverNode(null)}
          onNodeDragEnd={(n) => {
            const node = n as GraphNodeView & {
              x: number;
              y: number;
              fx: number;
              fy: number;
            };
            // Pin nodes where you drop them so layout stays stable.
            node.fx = node.x;
            node.fy = node.y;
          }}
        />
      )}
      {!filtered && (
        <div className="flex items-center justify-center h-full text-sm text-[var(--muted)]">
          Loading graph…
        </div>
      )}
      {filtered && filtered.nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-[var(--muted)] pointer-events-none">
          No entries match the selected tags.
        </div>
      )}
      {hoverNode && (
        <HoverCard node={hoverNode} x={pointer.x} y={pointer.y} />
      )}
    </div>
  );
}
