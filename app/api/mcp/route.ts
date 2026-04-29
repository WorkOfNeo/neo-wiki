import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildServer } from "@/lib/mcp/server";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

async function handle(req: Request): Promise<Response> {
  const authError = checkAuth(req);
  if (authError) return authError;

  // Stateless mode: no session tracking. Each request spins up its own
  // transport+server pair, runs the JSON-RPC exchange, and returns.
  // enableJsonResponse=true skips SSE, which is simpler on Vercel and
  // sufficient for tool calls (no server-initiated notifications).
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  const server = buildServer();
  await server.connect(transport);

  return transport.handleRequest(req);
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
