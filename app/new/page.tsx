"use client";

import { EntryEditor, EntryDraft } from "@/components/EntryEditor";
import { EntryShell } from "@/components/EntryShell";
import { createEntryAction } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function NewEntryPage() {
  const router = useRouter();
  return (
    <EntryShell>
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">
          New entry
        </h1>
        <EntryEditor
          submitLabel="Create"
          onCancel={() => router.back()}
          onSubmit={async (draft: EntryDraft) => {
            await createEntryAction(draft);
          }}
        />
      </div>
    </EntryShell>
  );
}
