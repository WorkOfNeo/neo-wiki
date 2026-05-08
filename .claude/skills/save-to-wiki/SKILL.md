---
name: save-to-wiki
description: Capture substantive findings from the current session into the NEO Labs wiki via the wiki_write MCP tool. Use when the user says "save this", "add to wiki", "wiki this", "remember this", or proactively after working through a non-trivial problem worth preserving (debugging sessions where multiple approaches were tried, architecture decisions, new patterns, gotchas hit). Categorizes entries with namespaced tags (client:, product:, stack:, pattern:, gotcha:, lang:) and structures content as Context / What we tried / What worked / What didn't and why / Gotchas / Code.
---

# save-to-wiki

Capture session learnings into the NEO Labs wiki so future-Neo (and future-Claude) can find them.

## When to invoke

**User-driven (always):**
- "save this to the wiki", "wiki this", "add to wiki"
- "remember this", "we should write this down"

**Proactively offer at end of session if:**
- Solved a non-trivial problem after multiple iterations
- Discovered a non-obvious gotcha that cost real time to find
- Made a meaningful architecture decision worth re-reading later
- The same problem is likely to come up again across NEO projects

If proactive, ask first — don't auto-write:
> "Worth saving to the wiki? I'd capture: <one-line summary>"

Wait for confirmation before calling `wiki_write`.

## How to compile the entry

The MCP server is `neo-labs-wiki`. The tool is `wiki_write`.

### 1. Title

Concrete and searchable. 4–8 words. Lead with the specific concept, not a verb.

- ✅ "Bedrock EU model ID format"
- ✅ "Mikenta Webflow → Monday sync via Inngest"
- ❌ "AWS notes" (too vague)
- ❌ "How to fix the Webflow bug" (action-oriented, not searchable)

### 2. Content (markdown)

Use this structure unless the entry is genuinely simpler:

```markdown
## Context
<One paragraph: what client/project, what problem, why it mattered.
Future-you reading this in 6 months needs to remember why this came up.>

## What we tried
<Numbered list. Each item: what you tried + brief reasoning for trying it.>

## What worked
<The final solution, with enough detail to re-execute. If it's a config change,
include the actual values. If it's a code pattern, include the snippet.>

## What didn't work and why
<Approaches you ruled out, with the actual failure mode — not "X was wrong"
but "X failed because Y". This is often the most valuable part: it stops
future-you from re-trying dead ends.>

## Gotchas
<Anything counter-intuitive, surprising, or easy to forget. Bullet list.>

## Code
<Minimal reproducible snippet. Full files only when necessary.>
```

Skip sections that aren't relevant. A 2-paragraph entry is fine if that's all there is.

### 3. Tags (mandatory — at least one)

Always include at least one of `client:*` or `product:*`. Add others as relevant.

- `client:` — `mikenta`, `contrast`, `werk`, `2biz`, `viio`, `flc`, `hyper-perfume`
- `product:` — `clerkr`, `neolabs`
- `stack:` — `webflow`, `nextjs`, `shopify`, `bedrock`, `openai`, `prisma`, `vercel`, `neon`, `postgres`, `pgvector`, `inngest`, `sharepoint`, `monday`, `mailchimp`, `hubspot`, `railway`
- `pattern:` — `rag`, `sync`, `scrape`, `embed`, `form`, `calculator`, `slider`, `system-prompt`
- `gotcha:` — `bedrock-region`, `translate3d`, `shopify-context`, `cors`, `auth`, `quota`, `monorepo`
- `lang:` — `danish`, `english`

If work isn't tied to a specific client/product, use `product:neolabs`. New tags are fine to introduce — just keep the namespace prefix (`stack:`, `pattern:`, etc).

### 4. Flavor

- `NOTEBOOK` (default) — timestamped, append-only, "what we tried, what we found"
- `DISTILLED` — only when the user explicitly asks for a "living doc" / "final answer", OR when consolidating multiple notebook entries

When in doubt, NOTEBOOK.

## Calling the tool

```
wiki_write({
  title: "...",
  content: "...",
  tags: ["client:mikenta", "stack:webflow"],
  flavor: "NOTEBOOK"  // optional, defaults to NOTEBOOK
})
```

## After saving

Paste the URL the tool returns so Neo can verify:

> Saved → https://wiki.neo-labs.com/entry/abc123

## Anti-patterns

- ❌ Don't save trivial answers (one-line fixes, well-known commands, things any tutorial covers)
- ❌ Don't invent client/product tags. Stick to the list above unless Neo confirms a new one
- ❌ Don't reuse an existing title — `wiki_write` creates a new entry every time. To extend an existing entry, use `wiki_update` instead
- ❌ Don't dump the entire conversation transcript. Compile only what's worth keeping
- ❌ Don't write entries that are pure action items / TODOs. The wiki is for accumulated knowledge, not task tracking
