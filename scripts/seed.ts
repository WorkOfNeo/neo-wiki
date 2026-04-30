/**
 * Seed the wiki with a handful of representative entries pulled from NEO
 * Labs work. Run once on a fresh DB:
 *
 *   npx dotenv -e .env.local -- tsx scripts/seed.ts
 *
 * Safe to re-run: skips entries whose title already exists.
 */
import { prisma } from "../lib/db";
import { createEntry } from "../lib/wiki";

const ENTRIES: {
  title: string;
  content: string;
  tags: string[];
  flavor?: "NOTEBOOK" | "DISTILLED";
}[] = [
  {
    title: "Bedrock EU model ID format",
    flavor: "DISTILLED",
    tags: ["product:clerkr", "stack:bedrock", "gotcha:bedrock-region"],
    content: `## Context
Clerkr runs Anthropic models on AWS Bedrock for EU residency. EU regions need a different model ID format than us-east-1.

## What works
EU model IDs are prefixed with the region group:

\`\`\`
eu.anthropic.claude-sonnet-4-20250514-v1:0
\`\`\`

NOT \`anthropic.claude-sonnet-4-20250514-v1:0\` — that's the us-east-1 ID and will 400 in eu-central-1.

## Gotcha
The Bedrock console autocompletes the us-east form even when you've selected an EU region. Always paste the \`eu.\`-prefixed form into the SDK call.

## Code
\`\`\`ts
const MODEL_ID = "eu.anthropic.claude-sonnet-4-20250514-v1:0";
const client = new BedrockRuntimeClient({ region: "eu-central-1" });
\`\`\``,
  },
  {
    title: "Mikenta Webflow → Monday sync via Inngest",
    tags: [
      "client:mikenta",
      "stack:webflow",
      "stack:monday",
      "stack:inngest",
      "pattern:sync",
    ],
    content: `## Context
Mikenta lead form on Webflow needs to land in Monday with deduplication and retry. Webflow webhooks don't retry, so we route through Inngest.

## Architecture
1. Webflow form submit -> POST /api/leads (Next.js route)
2. Route validates + sends an Inngest event
3. Inngest function: upsert in Monday with idempotency key = email+timestamp-bucket

## What worked
- Idempotency key prevented duplicates when the user double-submits
- Inngest's auto-retry handled Monday API 429s gracefully
- Step functions kept the function under Vercel's 10s limit

## Gotcha
Monday's column IDs are NOT stable across environments. Always read them from a config file keyed by board ID, never hardcode.`,
  },
  {
    title: "Webflow translate3d breaks position:fixed children",
    tags: ["stack:webflow", "gotcha:translate3d"],
    content: `## Symptom
A modal with \`position: fixed\` is being clipped to its parent's bounding box, not the viewport.

## Cause
Webflow's interactions add \`transform: translate3d(0,0,0)\` to ancestors for GPU acceleration. Any transformed ancestor turns into a containing block for fixed-position descendants — that's a CSS spec rule, not a Webflow bug.

## Fix
Either:
1. Move the modal outside the transformed ancestor (portal-style append to body)
2. Strip the interaction from the ancestor

Option 1 is more reliable; #2 breaks if a designer re-adds the interaction later.`,
  },
  {
    title: "Clerkr RAG: chunk + embed strategy",
    flavor: "DISTILLED",
    tags: ["product:clerkr", "stack:openai", "stack:pgvector", "pattern:rag"],
    content: `## Current best understanding
After several rewrites, settled on:

- **Chunking**: 800 tokens with 100-token overlap, split on paragraph then sentence boundary
- **Embedding**: \`text-embedding-3-small\` (1536 dims) — \`-large\` adds cost without measurable recall gain on Danish/English mix
- **Index**: HNSW with cosine, m=16, ef_construction=64. Switched from IVFFlat after recall dropped on small (<2k) collections.
- **Retrieval**: top-20 by cosine, then re-rank with LLM scoring of query↔chunk relevance, return top-5

## What didn't work
- Pure cosine without reranking: too many surface-similar but irrelevant matches
- Larger chunks (2000 tokens): lost precision on specific facts
- Sliding window without overlap: edge facts got missed`,
  },
  {
    title: "Vercel + Prisma cold start mitigation",
    tags: ["stack:nextjs", "stack:prisma", "stack:vercel", "pattern:sync"],
    content: `## Context
First request after a cold start was hitting 4-6s on Vercel. Most of it was Prisma engine startup + initial DB handshake.

## What helped
1. **Pooled Neon connection** (the \`-pooler\` URL) cut the handshake from ~800ms to ~150ms
2. **Edge runtime where possible**: routes that only do simple SELECTs can skip Prisma entirely with a direct \`postgres\` driver, ~200ms saved
3. **\`generated\` Prisma client kept warm** by hitting any DB route once per minute via cron

## Trade-offs
- Connection pooler doesn't support prepared statements; some advanced Prisma features need direct URL
- Edge runtime can't use Prisma's regular client — needs Accelerate or a different driver`,
  },
  {
    title: "Shopify storefront context confusion",
    tags: ["client:hyper-perfume", "stack:shopify", "gotcha:shopify-context"],
    content: `## Symptom
Customer-facing storefront API returned products with prices in DKK even though the request specified USD. Cache headers looked fine.

## Root cause
The \`@inContext(country: ...)\` directive needs to be on the OUTERMOST query, not on individual fields. We had it on \`product\` but not on the wrapping query, so Shopify silently fell back to the shop's primary market (Denmark).

## Fix
\`\`\`graphql
query Products @inContext(country: US) {
  products(first: 10) { ... }
}
\`\`\`

Not:
\`\`\`graphql
query Products {
  products(first: 10) @inContext(country: US) { ... }  # wrong
}
\`\`\``,
  },
  {
    title: "Danish system prompts: tone calibration",
    tags: ["product:clerkr", "lang:danish", "pattern:system-prompt"],
    content: `## Context
Danish-language Claude responses came out either too formal ("De" + flowery) or weirdly casual. Anthropic's model leans American-corporate by default.

## What works in the system prompt
- "Du-form, ikke De-form" — explicit
- "Skriv som en dansk konsulent: konkret, lidt understated, ingen amerikansk overdrevenhed"
- Provide 1-2 example Q&As in the system prompt with the desired tone

## What didn't work
- Just saying "skriv på dansk" — gets you grammatically Danish but tonally American
- Negative instructions only ("ikke overdrevent") — the model needs a positive anchor`,
  },
  {
    title: "Neo Labs deploy convention",
    flavor: "DISTILLED",
    tags: ["product:neolabs", "stack:vercel"],
    content: `## Convention
- Production branch: \`main\`
- Preview = every other branch
- Custom domain on production only; previews use the \`*.vercel.app\` URL
- Env vars set per-environment in Vercel dashboard, not committed

## Naming
- Repo name = subdomain on \`neo-labs.com\` where applicable
- \`[client]-[product]\` pattern for client work, e.g. \`mikenta-leads\`
- Pure NEO products use the product name only: \`clerkr\`, \`neo-wiki\``,
  },
];

async function main() {
  for (const e of ENTRIES) {
    const exists = await prisma.entry.findFirst({
      where: { title: e.title },
      select: { id: true },
    });
    if (exists) {
      console.log(`skip "${e.title}" (already exists)`);
      continue;
    }
    const created = await createEntry(e);
    console.log(`+ ${created.id}  ${e.title}`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
