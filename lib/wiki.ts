import { prisma } from "./db";
import { embed, toVectorLiteral } from "./embeddings";

export type Flavor = "NOTEBOOK" | "DISTILLED";

export interface WriteInput {
  title: string;
  content: string;
  tags: string[];
  flavor?: Flavor;
}

export interface UpdateInput {
  id: string;
  title?: string;
  content?: string;
  tags?: string[];
  flavor?: Flavor;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  tags: string[];
  flavor: Flavor;
  similarity: number;
  updatedAt: Date;
}

/** Create a new entry. Embeds title + content together. */
export async function createEntry(input: WriteInput) {
  const vector = await embed(`${input.title}\n\n${input.content}`);
  const created = await prisma.entry.create({
    data: {
      title: input.title,
      content: input.content,
      tags: input.tags,
      flavor: input.flavor ?? "NOTEBOOK",
    },
  });
  await prisma.$executeRawUnsafe(
    `UPDATE "Entry" SET embedding = $1::vector WHERE id = $2`,
    toVectorLiteral(vector),
    created.id
  );
  return created;
}

/** Update an entry. Re-embeds if title or content changed. */
export async function updateEntry(input: UpdateInput) {
  const existing = await prisma.entry.findUnique({ where: { id: input.id } });
  if (!existing) throw new Error(`Entry ${input.id} not found`);

  const updated = await prisma.entry.update({
    where: { id: input.id },
    data: {
      title: input.title ?? existing.title,
      content: input.content ?? existing.content,
      tags: input.tags ?? existing.tags,
      flavor: input.flavor ?? existing.flavor,
    },
  });

  const titleChanged = input.title && input.title !== existing.title;
  const contentChanged = input.content && input.content !== existing.content;
  if (titleChanged || contentChanged) {
    const vector = await embed(`${updated.title}\n\n${updated.content}`);
    await prisma.$executeRawUnsafe(
      `UPDATE "Entry" SET embedding = $1::vector WHERE id = $2`,
      toVectorLiteral(vector),
      updated.id
    );
  }

  return updated;
}

/** Get one entry by id, with linked entries. */
export async function getEntry(id: string) {
  return prisma.entry.findUnique({
    where: { id },
    include: {
      linksFrom: { include: { to: true } },
      linksTo: { include: { from: true } },
    },
  });
}

/**
 * Semantic + tag search.
 * - If query provided: ranks by cosine similarity, optionally filtered by tags
 * - If no query: returns most recent matching tags
 */
export async function searchEntries(opts: {
  query?: string;
  tags?: string[];
  limit?: number;
}): Promise<SearchResult[]> {
  const limit = Math.min(opts.limit ?? 10, 50);
  const tagFilter = opts.tags?.length
    ? `AND tags && ARRAY[${opts.tags.map((t) => `'${t.replace(/'/g, "''")}'`).join(",")}]::text[]`
    : "";

  if (!opts.query) {
    const rows = await prisma.$queryRawUnsafe<SearchResult[]>(
      `SELECT id, title, content, tags, flavor, "updatedAt", 0::float as similarity
       FROM "Entry"
       WHERE 1=1 ${tagFilter}
       ORDER BY "updatedAt" DESC
       LIMIT ${limit}`
    );
    return rows;
  }

  const vector = await embed(opts.query);
  const rows = await prisma.$queryRawUnsafe<SearchResult[]>(
    `SELECT id, title, content, tags, flavor, "updatedAt",
            1 - (embedding <=> $1::vector) as similarity
     FROM "Entry"
     WHERE embedding IS NOT NULL ${tagFilter}
     ORDER BY embedding <=> $1::vector
     LIMIT ${limit}`,
    toVectorLiteral(vector)
  );
  return rows;
}

export async function listRecent(opts: { limit?: number; tags?: string[] }) {
  return searchEntries({ tags: opts.tags, limit: opts.limit ?? 10 });
}

export async function deleteEntry(id: string) {
  return prisma.entry.delete({ where: { id } });
}
