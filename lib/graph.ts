import { prisma } from "./db";

export interface GraphNode {
  id: string;
  title: string;
  tags: string[];
  flavor: "NOTEBOOK" | "DISTILLED";
  size: number;
}

export interface GraphLink {
  source: string;
  target: string;
  weight: number;
  kind: "semantic" | "explicit";
}

const TAG_WEIGHT = 0.3;
const SEM_WEIGHT = 0.7;
const THRESHOLD = 0.45;
/** Tags present in more than this fraction of entries are excluded from
 *  Jaccard similarity. Stops "we're all Clerkr / all Next.js" from creating
 *  spurious edges between unrelated entries that happen to share a global
 *  tag. Self-tunes as the wiki grows: a once-rare tag can become "common"
 *  and drop out of the similarity calculation automatically. */
const COMMON_TAG_THRESHOLD = 0.5;

/**
 * Compute graph nodes + edges. For < ~1k entries this is fine to do on
 * the fly: the heavy lift happens in Postgres via a single self-join.
 */
export async function buildGraph(): Promise<{
  nodes: GraphNode[];
  links: GraphLink[];
}> {
  const entries = await prisma.$queryRawUnsafe<
    {
      id: string;
      title: string;
      tags: string[];
      flavor: "NOTEBOOK" | "DISTILLED";
    }[]
  >(`SELECT id, title, tags, flavor FROM "Entry"`);

  // Pairwise edges: tag Jaccard + cosine similarity, restricted to upper
  // triangle (a.id < b.id) so we never emit duplicates.
  // `common_tags` filters out tags present in > COMMON_TAG_THRESHOLD of
  // entries — those are background, not signal. `filtered_tags` is each
  // entry's tag list minus the common ones, used for Jaccard.
  const pairs = await prisma.$queryRawUnsafe<
    {
      a: string;
      b: string;
      tag_score: number;
      sem_score: number;
    }[]
  >(
    `
    WITH total AS (SELECT COUNT(*)::float AS n FROM "Entry"),
    common_tags AS (
      SELECT t AS tag
      FROM (SELECT unnest(tags) AS t FROM "Entry") tt
      GROUP BY t
      HAVING COUNT(*)::float / (SELECT n FROM total) > $1
    ),
    filtered AS (
      SELECT
        e.id,
        e.embedding,
        ARRAY(
          SELECT t FROM unnest(e.tags) t
          WHERE t NOT IN (SELECT tag FROM common_tags)
        ) AS tags
      FROM "Entry" e
    )
    SELECT
      a.id AS a,
      b.id AS b,
      CASE
        WHEN cardinality(a.tags) + cardinality(b.tags) = 0 THEN 0
        ELSE cardinality(ARRAY(SELECT unnest(a.tags) INTERSECT SELECT unnest(b.tags)))::float
           / NULLIF(cardinality(ARRAY(SELECT unnest(a.tags) UNION SELECT unnest(b.tags)))::float, 0)
      END AS tag_score,
      CASE
        WHEN a.embedding IS NULL OR b.embedding IS NULL THEN 0
        ELSE 1 - (a.embedding <=> b.embedding)
      END AS sem_score
    FROM filtered a
    JOIN filtered b ON a.id < b.id
  `,
    COMMON_TAG_THRESHOLD
  );

  const explicit = await prisma.link.findMany({
    select: { fromId: true, toId: true },
  });

  const explicitKeys = new Set(
    explicit.map((l) =>
      l.fromId < l.toId ? `${l.fromId}|${l.toId}` : `${l.toId}|${l.fromId}`
    )
  );

  const links: GraphLink[] = [];
  const linkCount = new Map<string, number>();
  const bump = (id: string) => linkCount.set(id, (linkCount.get(id) ?? 0) + 1);

  for (const p of pairs) {
    const key = `${p.a}|${p.b}`;
    if (explicitKeys.has(key)) {
      links.push({ source: p.a, target: p.b, weight: 1, kind: "explicit" });
      bump(p.a);
      bump(p.b);
      continue;
    }
    const weight = TAG_WEIGHT * p.tag_score + SEM_WEIGHT * p.sem_score;
    if (weight > THRESHOLD) {
      links.push({ source: p.a, target: p.b, weight, kind: "semantic" });
      bump(p.a);
      bump(p.b);
    }
  }

  const nodes: GraphNode[] = entries.map((e) => ({
    id: e.id,
    title: e.title,
    tags: e.tags,
    flavor: e.flavor,
    size: 1 + (linkCount.get(e.id) ?? 0),
  }));

  return { nodes, links };
}
