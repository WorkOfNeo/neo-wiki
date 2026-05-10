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

  /**
   * Compute connected components and pick a label tag for each cluster.
   * The leader of a component is the highest-degree node — we render the
   * label near it. Label is the tag with the highest "distinctiveness"
   * within the component: count_in_component / count_globally. That favors
   * tags that are concentrated in the cluster over tags that show up
   * everywhere.
   */
  const componentLeaders = useMemo(() => {
    const leaders = new Map<string, string>(); // node id -> cluster label
    if (!filtered || filtered.nodes.length === 0) return leaders;

    // Build adjacency
    const adj = new Map<string, string[]>();
    for (const n of filtered.nodes) adj.set(n.id, []);
    for (const l of filtered.links) {
      const a = endpointId(l.source);
      const b = endpointId(l.target);
      adj.get(a)?.push(b);
      adj.get(b)?.push(a);
    }

    // Global tag frequency (across all visible nodes)
    const globalTagCount = new Map<string, number>();
    for (const n of filtered.nodes) {
      for (const t of n.tags) {
        globalTagCount.set(t, (globalTagCount.get(t) ?? 0) + 1);
      }
    }

    const visited = new Set<string>();
    const nodeById = new Map(filtered.nodes.map((n) => [n.id, n]));

    for (const start of filtered.nodes) {
      if (visited.has(start.id)) continue;
      // BFS the component
      const comp: string[] = [];
      const queue = [start.id];
      visited.add(start.id);
      while (queue.length) {
        const cur = queue.shift()!;
        comp.push(cur);
        for (const next of adj.get(cur) ?? []) {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
      }
      if (comp.length < 2) continue; // singletons get no label

      // Pick the leader: highest degree
      let leaderId = comp[0];
      let leaderDeg = -1;
      for (const id of comp) {
        const deg = (adj.get(id) ?? []).length;
        if (deg > leaderDeg) {
          leaderDeg = deg;
          leaderId = id;
        }
      }

      // Pick the label tag: most distinctive (concentrated in cluster)
      const localCount = new Map<string, number>();
      for (const id of comp) {
        const n = nodeById.get(id);
        if (!n) continue;
        for (const t of n.tags) {
          localCount.set(t, (localCount.get(t) ?? 0) + 1);
        }
      }
      let bestTag = "";
      let bestScore = -1;
      for (const [tag, lc] of localCount) {
        const gc = globalTagCount.get(tag) ?? 1;
        // Distinctiveness: how concentrated is this tag in the cluster
        // relative to globally? Plus a small absolute-count term so
        // single-occurrence tags don't win on a pure ratio.
        const score = (lc / gc) * Math.sqrt(lc);
        if (score > bestScore) {
          bestScore = score;
          bestTag = tag;
        }
      }
      if (bestTag) leaders.set(leaderId, bestTag);
    }
    return leaders;
  }, [filtered]);

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
            // Cluster leader label — always rendered, regardless of zoom.
            // Sits ABOVE the node so it doesn't fight with node titles below.
            const clusterLabel = componentLeaders.get(node.id);
            if (clusterLabel) {
              const fontSize = Math.max(11, 14 / globalScale);
              ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
              const padX = 5 / globalScale;
              const padY = 3 / globalScale;
              const metrics = ctx.measureText(clusterLabel);
              const w = metrics.width + padX * 2;
              const h = fontSize + padY * 2;
              const cx = node.x;
              const cy = node.y - r - h / 2 - 6 / globalScale;
              // Soft pill background so the label is readable against any cluster color
              ctx.fillStyle = "rgba(255,255,255,0.92)";
              ctx.strokeStyle = primaryColor(node.tags);
              ctx.lineWidth = 1 / globalScale;
              const radius = h / 2;
              ctx.beginPath();
              ctx.moveTo(cx - w / 2 + radius, cy - h / 2);
              ctx.lineTo(cx + w / 2 - radius, cy - h / 2);
              ctx.arc(cx + w / 2 - radius, cy, radius, -Math.PI / 2, Math.PI / 2);
              ctx.lineTo(cx - w / 2 + radius, cy + h / 2);
              ctx.arc(cx - w / 2 + radius, cy, radius, Math.PI / 2, -Math.PI / 2);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = "#1f1f1f";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(clusterLabel, cx, cy);
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
