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

**Proactively offer ONLY when ALL of these are true:**
- The fix or finding has been **explicitly verified to work** (test passed, build succeeded, command produced expected output, user said "works"/"fixed"/"good")
- It cost real time to find or reason out (not a single-line config change anyone could google)
- It's likely to recur on another NEO Labs project, or future-you would benefit from re-reading it

If proactive, ask first — never auto-write:
> "Worth saving to the wiki? I'd capture: <one-line summary>"

Wait for explicit confirmation before calling `wiki_write`. "Maybe" or silence ≠ confirmation.

## Truthfulness rules (non-negotiable)

The wiki's value depends on entries being accurate. A confidently-wrong entry is worse than no entry — it poisons future searches and wastes future-Neo's time when they trust it. Therefore:

1. **No fabrication.** Every fact, code snippet, command, error message, version number, file path, and config value in the entry must come from something *actually observed in this session*. If you weren't there for it, don't write it.
2. **Quote, don't paraphrase, errors and outputs.** If the session contains a real error message, paste the verbatim text. Don't write a "polished" version that subtly drifts from reality.
3. **Distinguish observed from inferred.** If a step was discussed but not actually executed, label it explicitly: *"(reasoned but not tested in this session)"*. If you're unsure something is true, omit it.
4. **No invented context.** Don't add plausible-sounding "Why this matters" framing if the user didn't actually express that concern. Just say what happened.
5. **No invented numbers.** Latency figures, line counts, timing, sizes — only include if they were measured in the session. Don't estimate.
6. **No invented architecture.** If the entry implies a system design (e.g. "we route through Inngest"), that flow must have actually been built or directly described by the user in this session. Don't extrapolate from a tag.
7. **When in doubt, leave it out.** A short, accurate entry is more valuable than a thorough one with one wrong detail.

If you can't write the entry without speculating, ask the user to fill in the missing facts before saving — or decline to save and explain why.

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

Tags are **namespaced text** (`namespace:value`). The wiki app does NOT enforce a fixed vocabulary — Postgres stores them as free-form `text[]`. The lists below are *known values currently in use*, not the universe of allowed values.

**Read the actual entry context first**, then pick the namespace + value that genuinely describes it. If nothing in the known-values list fits cleanly, **introduce a new value** with the right namespace prefix and add it to this skill file in your write turn so it's discoverable later.

#### What each namespace means

- **`client:`** — work done *for* a paying client. Value is the client name (slug-cased). Known: `mikenta`, `contrast`, `werk`, `2biz`, `viio`, `flc`, `hyper-perfume`. New value when: a new client engagement.

- **`product:`** — a specific Neo product or app. Use the *most specific* one. Known: `clerkr` (the SaaS), `neo-wiki` (this wiki), `taskconnect`. `neolabs` is the catch-all for internal tooling that doesn't have its own app name. New value when: a new internal app/tool that's substantial enough to deserve its own bucket.

- **`stack:`** — a technology, framework, library, service, or platform involved. Known: `nextjs`, `bedrock`, `openai`, `prisma`, `postgres`, `pgvector`, `vercel`, `railway`, `neon`, `inngest`, `webflow`, `shopify`, `sharepoint`, `monday`, `mailchimp`, `hubspot`, `claude`. New value when: any tech first appears (e.g. `stack:redis`, `stack:supabase`). Be liberal — these are the most useful filter dimension.

- **`pattern:`** — a *reusable solution shape* observed across projects. Should be transferable, not tied to one client. Known: `rag`, `sync`, `embed`, `form`, `calculator`, `slider`, `system-prompt`, `agentic-execution`, `scrape`. New value when: a recurring approach you'd recognize on another project — `pattern:event-sourcing`, `pattern:hybrid-search`, `pattern:idempotent-webhook`, etc. Don't reuse `pattern:rag` for everything that has retrieval — distinguish meaningfully.

- **`gotcha:`** — *a non-obvious pitfall worth flagging by itself*. Should describe the **trap**, not the technology. Known: `bedrock-region`, `translate3d`, `shopify-context`, `cors`, `auth`, `quota`, `monorepo`. New values are common and welcome — `gotcha:rate-limit`, `gotcha:env-var-quoting`, `gotcha:next-cache-invalidation`, `gotcha:prisma-schema-drift`, `gotcha:webhook-replay`. The bar: would future-Neo, six months later, want to filter the wiki by this specific kind of trap? If yes, give it its own gotcha tag.

- **`scope:`** — orthogonal axis: who this work is *for*. Known: `internal` (tooling Neo built for himself), `client-facing` (work shipped to paying clients). Optional — only add if it's a useful distinction the entry doesn't already encode (e.g. an internal admin script for a Clerkr feature might be `product:clerkr` + `scope:internal`).

- **`lang:`** — only when content is language-specific (Danish prompts, etc.). Known: `danish`, `english`. New value when: another language matters.

#### Tag choice rules

1. **Always include at least one of `client:*` or `product:*`** — this is the "what is this about" anchor.
2. **Add 2–4 stack/pattern/gotcha tags** — these make the entry findable by topic. An entry with only `product:clerkr` will be hard to retrieve next year; an entry with `product:clerkr + stack:bedrock + gotcha:rate-limit + pattern:agentic-execution` is.
3. **Prefer specific over generic.** `gotcha:bedrock-region` beats `gotcha:auth`. `pattern:hybrid-search` beats `pattern:rag` if hybrid is what's interesting.
4. **Don't tag what isn't in the entry.** A tag should map to something actually discussed in the body. If you tagged `gotcha:cors` but didn't write about CORS, drop it.
5. **When introducing a new value**, write it once in lowercase-with-hyphens form, namespace prefix included. After saving, the value is now part of the live vocabulary — no other action needed.

### 4. Flavor

- `NOTEBOOK` (default) — timestamped, append-only, "what we tried, what we found"
- `DISTILLED` — only when the user explicitly asks for a "living doc" / "final answer", OR when consolidating multiple notebook entries

When in doubt, NOTEBOOK.

## Search before writing (mandatory)

Before calling `wiki_write`, **always run `wiki_search`** with the proposed title and a tag filter when the topic clearly maps to a client/product/stack. This prevents duplicates and lets us extend living knowledge instead of fragmenting it.

Decision rule based on top result's `similarity`:

| Top similarity | Action |
| --- | --- |
| **≥ 0.75** | Treat as same topic. Ask: *"Found existing entry **'<title>'** (sim 0.XX). Update existing or create new?"* — default to update. |
| **0.55 – 0.75** | Borderline. Show the user the existing entry's title + preview and ask which path. |
| **< 0.55** | Genuinely new. Proceed with `wiki_write`. |

### Update flow (when extending)

For **NOTEBOOK** entries: append to the existing content with a dated section divider:

```markdown
---

## Update — 2026-04-29
<new findings>
```

Pass the *full* combined content (existing body + appended section) to `wiki_update`.

For **DISTILLED** entries: replace or rewrite affected sections, since DISTILLED is "current best understanding". Don't append — revise.

`wiki_update` re-embeds automatically when content or title changes.

## Calling the tool

```
// First — search:
wiki_search({ query: "<proposed title or topic>", tags: [...] })

// Then either:
wiki_write({
  title: "...",
  content: "...",
  tags: ["client:mikenta", "stack:webflow"],
  flavor: "NOTEBOOK"
})

// Or, when extending an existing entry:
wiki_update({
  id: "<existing entry id from search>",
  content: "<full combined content>",
  tags: [...]  // optional — only if tags need updating
})
```

## After saving

Paste the URL the tool returns so Neo can verify:

> Saved → https://wiki.neo-labs.com/entry/abc123

## Anti-patterns

- ❌ Don't save trivial answers (one-line fixes, well-known commands, things any tutorial covers)
- ❌ Don't invent client/product tags. Stick to the list above unless Neo confirms a new one
- ❌ Don't skip the search-before-write step. Duplicate entries are worse than a 200ms search call.
- ❌ Don't reuse an existing title — `wiki_write` creates a new entry every time. To extend an existing entry, use `wiki_update` instead
- ❌ Don't dump the entire conversation transcript. Compile only what's worth keeping
- ❌ Don't write entries that are pure action items / TODOs. The wiki is for accumulated knowledge, not task tracking
- ❌ Don't fabricate plausible-sounding details to round out a section. An entry with one invented field is worse than no entry.
- ❌ Don't save before verification. "I think this fix works" is not a save signal; "I ran the test and it passed" is.
- ❌ Don't propose to save during active debugging. Save AFTER the work concludes successfully, never mid-flow.
