import { buildGraph } from "@/lib/graph";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const data = await buildGraph();
  return Response.json(data);
}
