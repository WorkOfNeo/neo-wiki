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
