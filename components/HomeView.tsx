"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Graph } from "./Graph";

export function HomeView() {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  return (
    <div className="flex h-screen">
      <Sidebar
        selectedTags={selectedTags}
        onToggleTag={(t) =>
          setSelectedTags((prev) =>
            prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
          )
        }
        query={query}
        onQueryChange={setQuery}
      />
      <main className="flex-1 relative">
        <Graph selectedTags={selectedTags} />
      </main>
    </div>
  );
}
