"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";

/**
 * Sidebar + content shell for the /entry/[id] and /new routes.
 * Tag selection here is purely cosmetic — it doesn't filter anything
 * outside the home graph view. We still wire it up so the sidebar UI
 * is consistent across pages.
 */
export function EntryShell({ children }: { children: React.ReactNode }) {
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
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
