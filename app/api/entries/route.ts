import { z } from "zod";
import { createEntry, searchEntries } from "@/lib/wiki";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? undefined;
  const tagsParam = url.searchParams.get("tags");
  const limitParam = url.searchParams.get("limit");

  const tags = tagsParam ? tagsParam.split(",").filter(Boolean) : undefined;
  const limit = limitParam ? Number(limitParam) : undefined;

  const results = await searchEntries({ query: q, tags, limit });
  return Response.json({ results });
}

const createSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).min(1),
  flavor: z.enum(["NOTEBOOK", "DISTILLED"]).optional(),
});

export async function POST(req: Request) {
  const authError = checkAuth(req);
  if (authError) return authError;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const entry = await createEntry(parsed.data);
  return Response.json(entry, { status: 201 });
}
