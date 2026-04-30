# NEO Labs Wiki

Personal living wiki for NEO Labs work. Two interfaces over one Postgres:

- **MCP server** at `/api/mcp` — Claude can search/read/write entries from any conversation
- **Web UI** at `/` — force-directed graph, full-text + semantic search, inline editing

## Stack

- Next.js 16 (App Router), Tailwind 4
- Neon Postgres + pgvector (HNSW cosine index)
- Prisma 6
- OpenAI `text-embedding-3-small` (1536 dims)
- `@modelcontextprotocol/sdk` v1.29 with `WebStandardStreamableHTTPServerTransport`
- `react-force-graph-2d` for the graph view
- `@uiw/react-md-editor` + `react-markdown` for editing/rendering

## Setup

```bash
npm install
cp .env.local.example .env.local
# fill in DATABASE_URL, DIRECT_URL, OPENAI_API_KEY, WIKI_BEARER_TOKEN, WIKI_BASE_URL
npx dotenv -e .env.local -- prisma migrate deploy
npx dotenv -e .env.local -- tsx scripts/seed.ts   # optional
npm run dev
```

### Neon

1. Create a project, enable the `vector` extension via the SQL editor: `CREATE EXTENSION IF NOT EXISTS vector;`
2. Copy the pooled URL → `DATABASE_URL`
3. Derive the direct URL by removing `-pooler` from the host → `DIRECT_URL` (Prisma migrations need this)

### Bearer token

Generate once and put the same value in `.env.local` and Vercel's env settings:

```bash
openssl rand -hex 32
```

## API surface

### MCP — `POST /api/mcp` (bearer-auth'd)

Tools: `wiki_search`, `wiki_get`, `wiki_write`, `wiki_update`, `wiki_list_recent`. JSON-RPC over HTTP, stateless, returns JSON (no SSE).

### REST

| Method | Path                  | Auth     |
| ------ | --------------------- | -------- |
| GET    | `/api/entries`        | open     |
| POST   | `/api/entries`        | bearer   |
| GET    | `/api/entries/[id]`   | open     |
| PATCH  | `/api/entries/[id]`   | bearer   |
| DELETE | `/api/entries/[id]`   | bearer   |
| GET    | `/api/graph`          | open     |
| GET    | `/api/tags`           | open     |

UI write flows go through server actions (`app/actions.ts`) so the bearer never reaches the browser.

## Tag taxonomy

Namespaced strings, case-sensitive:

- `client:` — `mikenta`, `contrast`, `werk`, `2biz`, `viio`, `flc`, `hyper-perfume`
- `product:` — `clerkr`, `neolabs`
- `stack:` — `webflow`, `nextjs`, `shopify`, `bedrock`, `openai`, `prisma`, `vercel`, `neon`, `postgres`, `pgvector`, `inngest`, `sharepoint`, `monday`, `mailchimp`, `hubspot`
- `pattern:` — `rag`, `sync`, `scrape`, `embed`, `form`, `calculator`, `slider`, `system-prompt`
- `gotcha:` — `bedrock-region`, `translate3d`, `shopify-context`, `cors`, `auth`, `quota`, `monorepo`
- `lang:` — `danish`, `english`

New tags can be added freely; the UI auto-populates the filter from `unnest(tags)`.

## Edge weights (graph)

For each pair of entries:

- `tag_score` = Jaccard over tag arrays
- `sem_score` = cosine similarity of embeddings
- `weight = 0.4 * tag_score + 0.6 * sem_score`
- emit edge if `weight > 0.35`
- explicit `Link` rows get `weight = 1.0`

Computed on-the-fly via a single Postgres self-join. Fine up to ~1k entries.

## Deploy to Vercel

1. `vercel --prod` or push to `main`
2. In Vercel project settings → Environment Variables, add all `.env.local` values
3. Vercel auto-runs `prisma generate` via the `postinstall` step (added to `package.json`); migrations are not run automatically — deploy them via `prisma migrate deploy` from local first
4. Register `https://<your-domain>/api/mcp` as a connector in Claude with the bearer token as the auth header

## Repo conventions

- Production branch: `main`
- Commits: phase-N for build phases, otherwise short imperative
- `.env.local` is ignored; `.env.local.example` is committed as a template
