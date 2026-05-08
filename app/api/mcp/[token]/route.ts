/**
 * URL-token variant of the MCP endpoint.
 * For clients that can't send a custom Authorization header
 * (e.g. claude.ai's custom connector dialog).
 *
 * URL: /api/mcp/<WIKI_BEARER_TOKEN>
 *
 * Functionally equivalent to /api/mcp with Authorization: Bearer <token>.
 * The token in the URL is the same WIKI_BEARER_TOKEN value.
 */
import { timingSafeEqual } from "node:crypto";
import { Buffer } from "node:buffer";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildServer } from "@/lib/mcp/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

type Ctx = { params: Promise<{ token: string }> };

async function handle(req: Request, ctx: Ctx): Promise<Response> {
  const { token } = await ctx.params;
  const expected = process.env.WIKI_BEARER_TOKEN;
  if (!expected) {
    return new Response("Server misconfigured: WIKI_BEARER_TOKEN not set", {
      status: 500,
    });
  }
  // Constant-time comparison: avoids leaking length info via timing.
  if (
    token.length !== expected.length ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

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
