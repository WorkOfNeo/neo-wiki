import { z } from "zod";
import { deleteEntry, getEntry, updateEntry } from "@/lib/wiki";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const entry = await getEntry(id);
  if (!entry) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(entry);
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  tags: z.array(z.string()).min(1).optional(),
  flavor: z.enum(["NOTEBOOK", "DISTILLED"]).optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const authError = checkAuth(req);
  if (authError) return authError;

  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const entry = await updateEntry({ id, ...parsed.data });
    return Response.json(entry);
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 404 }
    );
  }
}

export async function DELETE(req: Request, ctx: Ctx) {
  const authError = checkAuth(req);
  if (authError) return authError;

  const { id } = await ctx.params;
  try {
    await deleteEntry(id);
    return new Response(null, { status: 204 });
  } catch {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
