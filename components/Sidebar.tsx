"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TagPill } from "./TagPill";

interface RecentEntry {
  id: string;
  title: string;
  tags: string[];
  updatedAt: string;
}

interface TagCount {
  tag: string;
  count: number;
}

export function Sidebar({
  selectedTags,
  onToggleTag,
  query,
  onQueryChange,
}: {
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const [tags, setTags] = useState<TagCount[]>([]);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [searchResults, setSearchResults] = useState<RecentEntry[]>([]);

  useEffect(() => {
    fetch("/api/tags").then((r) => r.json()).then((d) => setTags(d.tags ?? []));
    fetch("/api/entries?limit=10")
      .then((r) => r.json())
      .then((d) => setRecent(d.results ?? []));
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/entries?q=${encodeURIComponent(query)}&limit=8`, {
        signal: ctl.signal,
      })
        .then((r) => r.json())
        .then((d) => setSearchResults(d.results ?? []))
        .catch(() => {});
    }, 250);
    return () => {
      ctl.abort();
      clearTimeout(t);
    };
  }, [query]);

  const showing = useMemo(
    () => (query.trim() ? searchResults : recent),
    [query, searchResults, recent]
  );

  return (
    <aside className="w-72 shrink-0 border-r border-[var(--border)] h-screen overflow-y-auto bg-[var(--background)]">
      <div className="p-5 space-y-6">
        <div>
          <Link href="/" className="block">
            <h1 className="text-base font-semibold tracking-tight">
              NEO Labs Wiki
            </h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Living notes & decisions
            </p>
          </Link>
        </div>

        <input
          type="search"
          placeholder="Search…"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded bg-white focus:outline-none focus:border-[var(--accent)]"
        />

        <Link
          href="/new"
          className="block text-center text-sm py-2 rounded border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
        >
          + New entry
        </Link>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
            Tags
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {tags.length === 0 && (
              <span className="text-xs text-[var(--muted)]">No tags yet</span>
            )}
            {tags.map((t) => (
              <TagPill
                key={t.tag}
                tag={t.tag}
                active={selectedTags.includes(t.tag)}
                onClick={() => onToggleTag(t.tag)}
              />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
            {query.trim() ? "Search results" : "Recent"}
          </h2>
          <ul className="space-y-1">
            {showing.length === 0 && (
              <li className="text-xs text-[var(--muted)]">No entries</li>
            )}
            {showing.map((e) => (
              <li key={e.id}>
                <Link
                  href={`/entry/${e.id}`}
                  className="block px-2 py-1.5 -mx-2 text-sm hover:bg-[var(--surface)] rounded truncate"
                  title={e.title}
                >
                  {e.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </aside>
  );
}
