/**
 * Bearer token auth for write endpoints + MCP.
 * Returns null if authorized, or a 401 Response if not.
 */
export function checkAuth(req: Request): Response | null {
  const expected = process.env.WIKI_BEARER_TOKEN;
  if (!expected) {
    return new Response("Server misconfigured: WIKI_BEARER_TOKEN not set", {
      status: 500,
    });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
