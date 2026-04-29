"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { TagInput } from "./TagInput";

// MD editor is client-only and bulky — defer it.
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export type Flavor = "NOTEBOOK" | "DISTILLED";

export interface EntryDraft {
  title: string;
  content: string;
  tags: string[];
  flavor: Flavor;
}

export function EntryEditor({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial?: Partial<EntryDraft>;
  onSubmit: (draft: EntryDraft) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [flavor, setFlavor] = useState<Flavor>(initial?.flavor ?? "NOTEBOOK");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || tags.length === 0) {
      setError("Title, content, and at least one tag are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ title, content, tags, flavor });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Concrete and searchable"
          className="w-full px-3 py-2 text-base border border-[var(--border)] rounded bg-white focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
          Content
        </label>
        <div data-color-mode="light">
          <MDEditor
            value={content}
            onChange={(v) => setContent(v ?? "")}
            height={400}
            preview="edit"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
          Tags
        </label>
        <TagInput value={tags} onChange={setTags} />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider text-[var(--muted)] mb-1.5">
          Flavor
        </label>
        <div className="flex gap-2">
          {(["NOTEBOOK", "DISTILLED"] as Flavor[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFlavor(f)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                flavor === f
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-[var(--border)] rounded hover:bg-[var(--surface)]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
