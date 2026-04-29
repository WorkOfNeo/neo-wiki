"use client";

import { useEffect, useState } from "react";
import { TagPill } from "./TagPill";

export function TagInput({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then((d) => setSuggestions((d.tags ?? []).map((t: { tag: string }) => t.tag)))
      .catch(() => {});
  }, []);

  function commit(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (value.includes(tag)) return;
    onChange([...value, tag]);
    setDraft("");
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  const filtered = draft
    ? suggestions
        .filter((s) => s.toLowerCase().includes(draft.toLowerCase()))
        .filter((s) => !value.includes(s))
        .slice(0, 6)
    : [];

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1">
            <TagPill tag={t} />
            <button
              type="button"
              onClick={() => remove(t)}
              className="text-[var(--muted)] hover:text-[var(--foreground)] text-xs"
              aria-label={`Remove ${t}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          placeholder="client:mikenta, stack:webflow…"
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-white focus:outline-none focus:border-[var(--accent)]"
        />
        {filtered.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full bg-white border border-[var(--border)] rounded shadow-sm max-h-48 overflow-y-auto">
            {filtered.map((s) => (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => commit(s)}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--surface)]"
                >
                  {s}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-xs text-[var(--muted)] mt-1">
        Press Enter or comma to add. Use namespaces: client:, product:, stack:,
        pattern:, gotcha:, lang:
      </p>
    </div>
  );
}
