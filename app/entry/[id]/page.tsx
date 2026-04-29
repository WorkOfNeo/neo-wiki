import { notFound } from "next/navigation";
import { getEntry } from "@/lib/wiki";
import { EntryDetail, EntryFull } from "@/components/EntryDetail";
import { EntryShell } from "@/components/EntryShell";

export const dynamic = "force-dynamic";

export default async function EntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) notFound();

  const full: EntryFull = {
    id: entry.id,
    title: entry.title,
    content: entry.content,
    tags: entry.tags,
    flavor: entry.flavor,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
    linkedEntries: [
      ...entry.linksFrom.map((l) => ({
        id: l.to.id,
        title: l.to.title,
        kind: l.kind,
        direction: "outgoing" as const,
      })),
      ...entry.linksTo.map((l) => ({
        id: l.from.id,
        title: l.from.title,
        kind: l.kind,
        direction: "incoming" as const,
      })),
    ],
  };

  return (
    <EntryShell>
      <EntryDetail entry={full} />
    </EntryShell>
  );
}
