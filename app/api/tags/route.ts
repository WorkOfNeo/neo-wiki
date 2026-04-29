import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const rows = await prisma.$queryRawUnsafe<
    { tag: string; count: bigint }[]
  >(`
    SELECT tag, COUNT(*)::bigint AS count
    FROM (SELECT unnest(tags) AS tag FROM "Entry") t
    GROUP BY tag
    ORDER BY count DESC, tag ASC
  `);

  const tags = rows.map((r) => ({ tag: r.tag, count: Number(r.count) }));
  return Response.json({ tags });
}
