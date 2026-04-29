import Link from "next/link";
import { searchEntries } from "@/lib/wiki";
import { EntryShell } from "@/components/EntryShell";
import { TagPill } from "@/components/TagPill";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Phase 5 swaps this for the graph view. For now, a simple list
  // gives us a working UI to navigate from.
  const recent = await searchEntries({ limit: 25 });

  return (
    <EntryShell>
      <div className="max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Recent</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {recent.length === 0
              ? "Empty wiki. Write something via MCP or click + New entry."
              : `${recent.length} entries — graph view lands in phase 5.`}
          </p>
        </header>

        <ul className="divide-y divide-[var(--border)]">
          {recent.map((e) => (
            <li key={e.id} className="py-4">
              <Link href={`/entry/${e.id}`} className="block group">
                <h2 className="text-base font-medium group-hover:underline">
                  {e.title}
                </h2>
                <p className="text-sm text-[var(--muted)] mt-1 line-clamp-2">
                  {e.content.slice(0, 200)}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {e.tags.map((t) => (
                    <TagPill key={t} tag={t} />
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </EntryShell>
  );
}
