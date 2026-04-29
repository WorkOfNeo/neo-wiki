"use client";

import { useState } from "react";
import Link from "next/link";
import { MarkdownView } from "./MarkdownView";
import { TagPill } from "./TagPill";
import { EntryEditor, EntryDraft } from "./EntryEditor";
import { updateEntryAction, deleteEntryAction } from "@/app/actions";

interface LinkedEntry {
  id: string;
  title: string;
  kind: string;
  direction: "incoming" | "outgoing";
}

export interface EntryFull {
  id: string;
  title: string;
  content: string;
  tags: string[];
  flavor: "NOTEBOOK" | "DISTILLED";
  createdAt: string;
  updatedAt: string;
  linkedEntries: LinkedEntry[];
}

export function EntryDetail({ entry }: { entry: EntryFull }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (editing) {
    return (
      <EntryEditor
        initial={entry}
        submitLabel="Update"
        onCancel={() => setEditing(false)}
        onSubmit={async (draft: EntryDraft) => {
          await updateEntryAction({ id: entry.id, ...draft });
          setEditing(false);
        }}
      />
    );
  }

  const created = new Date(entry.createdAt);
  const updated = new Date(entry.updatedAt);

  return (
    <article className="max-w-3xl">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{entry.title}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[var(--muted)]">
            <span
              className="inline-block px-1.5 py-0.5 rounded border"
              style={{
                borderColor: "var(--border)",
                color: entry.flavor === "DISTILLED" ? "var(--accent)" : "var(--muted)",
              }}
            >
              {entry.flavor}
            </span>
            <span>·</span>
            <span title={created.toISOString()}>
              created {created.toLocaleDateString()}
            </span>
            <span>·</span>
            <span title={updated.toISOString()}>
              updated {updated.toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--surface)]"
          >
            Edit
          </button>
          <button
            onClick={() => setConfirming(true)}
            className="px-3 py-1.5 text-xs border border-[var(--border)] rounded hover:bg-[var(--surface)]"
          >
            Delete
          </button>
        </div>
      </div>

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {entry.tags.map((t) => (
            <TagPill key={t} tag={t} />
          ))}
        </div>
      )}

      <MarkdownView content={entry.content} />

      {entry.linkedEntries.length > 0 && (
        <section className="mt-10 pt-6 border-t border-[var(--border)]">
          <h2 className="text-xs uppercase tracking-wider text-[var(--muted)] mb-3">
            Linked entries
          </h2>
          <ul className="space-y-1.5">
            {entry.linkedEntries.map((l) => (
              <li key={`${l.id}-${l.kind}-${l.direction}`} className="text-sm">
                <span className="text-[var(--muted)] text-xs mr-2">
                  {l.direction === "outgoing" ? "→" : "←"} {l.kind}
                </span>
                <Link href={`/entry/${l.id}`} className="hover:underline">
                  {l.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {confirming && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white border border-[var(--border)] rounded p-5 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold mb-2">Delete this entry?</h3>
            <p className="text-sm text-[var(--muted)] mb-4">
              This can&rsquo;t be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-1.5 text-sm border border-[var(--border)] rounded hover:bg-[var(--surface)]"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteEntryAction(entry.id)}
                className="px-3 py-1.5 text-sm bg-red-700 text-white rounded hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
