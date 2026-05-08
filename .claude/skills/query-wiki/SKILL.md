---
name: query-wiki
description: Search the NEO Labs wiki via the wiki_search MCP tool BEFORE answering questions where prior context might exist. Use when the user asks "have we dealt with X before", "how did we set up Y", "what was the gotcha with Z", or anytime the question involves NEO Labs work — clients (mikenta, contrast, werk, 2biz, viio, flc, hyper-perfume), products (clerkr, neolabs), or stacks where past gotchas may exist (webflow, nextjs, shopify, bedrock, openai, prisma, vercel, neon, postgres, pgvector, inngest, sharepoint, monday, mailchimp, hubspot, railway). Saves Neo from re-deriving solutions to problems already solved.
---

# query-wiki

Search the NEO Labs wiki for relevant prior knowledge before answering — so Neo doesn't re-derive solutions already captured.

## When to invoke

**Always invoke before answering when:**
- User asks about a specific client: `mikenta`, `contrast`, `werk`, `2biz`, `viio`, `flc`, `hyper-perfume`
- User asks about a NEO product: `clerkr`, `neolabs`
- User uses recall phrasing: "have we...", "how did I/we...", "what's our pattern for...", "did we figure out..."
- User mentions a tech where past gotchas often exist: Bedrock, Webflow, Shopify, pgvector, Inngest, Monday, translate3d
- Beginning of a debugging session — call `wiki_list_recent` to orient on what was touched lately

**Don't invoke for:**
- General programming questions (use the wiki only for NEO-specific context)
- Trivia or well-known APIs
- When the user has already provided full context and isn't asking about prior work

## Procedure

### 1. Search before answering

The MCP server is `neo-labs-wiki`. Tools: `wiki_search`, `wiki_get`, `wiki_list_recent`.

Call `wiki_search` with:
- `query`: a natural-language version of what you'd want to know (not the user's exact words — extract the essence)
- `tags`: filter when the client/product is unambiguous

```
wiki_search({
  query: "Bedrock model ID format EU region",
  tags: ["product:clerkr", "stack:bedrock"]
})
```

### 2. Read similarity scores honestly

Each result has `similarity` (0-1) and a 300-char `preview`:

| Score   | Treat as                                                                     |
| ------- | ---------------------------------------------------------------------------- |
| > 0.7   | Almost certainly relevant — fetch full body with `wiki_get` and use it       |
| 0.5–0.7 | Likely relevant — read the preview, fetch if it confirms                     |
| 0.3–0.5 | Tangentially related — usually skip; mention only if directly applicable     |
| < 0.3   | Not relevant — ignore                                                        |

When the preview tells you enough, you don't always need to `wiki_get` — save the round-trip.

### 3. Cite the wiki when you use it — and verify before trusting

When wiki content informs your answer, name the entry and link to it:

> Per the wiki entry **"Bedrock EU model ID format"** (https://wiki.neo-labs.com/entry/abc123), EU regions need the `eu.`-prefixed model ID …

This lets Neo verify the source and read the full entry if needed.

**Skepticism rule:** the wiki may contain entries that are partially or fully outdated, or (rarely) seeded placeholder content from before the wiki was actively used. Before relying on a wiki entry for a real action:

1. Check the `updatedAt` timestamp. Anything older than ~6 months on a fast-moving stack (Bedrock, MCP SDK, Prisma, Next.js) is suspect — re-verify the specifics before acting.
2. Read the full body, not just the preview. Previews can hide caveats.
3. If the entry contradicts something obvious from the user's current context, surface the conflict to the user instead of silently choosing one source.
4. If the entry feels generic / template-shaped (no specific commands, no real error messages, no concrete commit references), treat it as a starting point, not gospel. Ask the user to confirm before relying on it.

When in doubt, say what the wiki claims AND that you can't independently verify it from this session — let Neo decide which to trust.

### 4. Be explicit when nothing is in the wiki

If `wiki_search` returns no relevant hits, say so:

> Nothing in the wiki on this — proceeding from first principles.

Then answer normally. At end of session, consider whether this is worth saving (the `save-to-wiki` skill handles that).

## Common queries

| User question                                       | `query` arg                              | `tags` filter                          |
| --------------------------------------------------- | ---------------------------------------- | -------------------------------------- |
| "What did we do with Bedrock for Clerkr?"           | "Bedrock model setup Clerkr"             | `["product:clerkr", "stack:bedrock"]`  |
| "Mikenta sync to Monday again?"                     | "Mikenta Webflow Monday sync"            | `["client:mikenta"]`                   |
| "Have we hit translate3d before?"                   | "translate3d position fixed"             | `["gotcha:translate3d"]`               |
| "Best chunking strategy for our RAG?"               | "RAG chunk size embedding strategy"      | `["pattern:rag"]`                      |
| "What have we touched lately?"                      | (use `wiki_list_recent` — no query)      | (optional)                             |
| "Danish system prompt — what worked?"               | "Danish tone system prompt calibration"  | `["lang:danish", "pattern:system-prompt"]` |
| "Shopify @inContext gotcha?"                        | "Shopify storefront context country"     | `["gotcha:shopify-context"]`           |

## Anti-patterns

- ❌ Don't search for general programming knowledge ("how does setTimeout work") — the wiki is NEO-specific
- ❌ Don't paste full search results into your response. Synthesize and cite
- ❌ Don't search after the user has already given you all the context — the wiki is for *prior* work, not what they just told you
- ❌ Don't fall back to the wiki when you should use `wiki_list_recent` (e.g. when the user wants orientation, not search)
- ❌ Don't fabricate citations. If you reference a wiki entry, it must exist and have come from a real `wiki_search` or `wiki_get` call this turn
- ❌ Don't combine details from multiple weakly-related entries into one synthetic answer. If the wiki has fragments, present the fragments — don't stitch a story.
- ❌ Don't assume an entry is current. Check `updatedAt`. Old entries on fast-moving stacks need re-verification.
