# NEO Labs Wiki

Personal living wiki for NEO Labs work. Two interfaces over one Postgres:

- **MCP server** at `/api/mcp` — Claude can search/read/write entries from any conversation
- **Web UI** at `/` — force-directed graph, full-text + semantic search, inline editing

## Stack

- Next.js 16 (App Router), Tailwind 4
- Railway Postgres + pgvector (HNSW cosine index)
- Prisma 6
- OpenAI `text-embedding-3-small` (1536 dims)
- `@modelcontextprotocol/sdk` v1.29 with `WebStandardStreamableHTTPServerTransport`
- `react-force-graph-2d` for the graph view
- `@uiw/react-md-editor` + `react-markdown` for editing/rendering

## Setup

```bash
npm install
cp .env.local.example .env.local
# fill in DATABASE_URL (with ?sslmode=require), OPENAI_API_KEY, WIKI_BEARER_TOKEN, WIKI_BASE_URL
npm run migrate
npm run seed      # optional — 8 example entries
npm run dev
```

### Railway

1. New project → **Deploy PostgreSQL**
2. Postgres service → SQL editor → `CREATE EXTENSION IF NOT EXISTS vector;`
3. Add a service from this repo (Nixpacks auto-detects Next.js)
4. App service env vars:
   - `DATABASE_URL=${{Postgres.DATABASE_PRIVATE_URL}}` (or paste the `*.railway.internal` URL)
   - `OPENAI_API_KEY`, `WIKI_BEARER_TOKEN`, `WIKI_BASE_URL`
5. For local migrations: copy the **public** URL from the Postgres service Variables tab and append `?sslmode=require`. Use this in `.env.local`.

### Bearer token

Generate once and put the same value in `.env.local` and the Railway service env:

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
- `product:` — `clerkr`, `neolabs`, `neo-wiki`, `taskconnect`
- `stack:` — `webflow`, `nextjs`, `shopify`, `bedrock`, `openai`, `prisma`, `vercel`, `neon`, `postgres`, `pgvector`, `inngest`, `sharepoint`, `monday`, `mailchimp`, `hubspot`, `railway`, `claude`
- `pattern:` — `rag`, `sync`, `scrape`, `embed`, `form`, `calculator`, `slider`, `system-prompt`, `agentic-execution`
- `gotcha:` — `bedrock-region`, `translate3d`, `shopify-context`, `cors`, `auth`, `quota`, `monorepo`
- `lang:` — `danish`, `english`
- `scope:` — `internal`, `client-facing` (optional; helps the graph cluster internal tooling separately from client work)

New tags can be added freely — they're free-form `text[]` in Postgres. Just keep the namespace prefix and update `.claude/skills/save-to-wiki/SKILL.md` so future Claude sessions know about them.

## Edge weights (graph)

For each pair of entries:

- `tag_score` = Jaccard over tag arrays
- `sem_score` = cosine similarity of embeddings
- `weight = 0.4 * tag_score + 0.6 * sem_score`
- emit edge if `weight > 0.35`
- explicit `Link` rows get `weight = 1.0`

Computed on-the-fly via a single Postgres self-join. Fine up to ~1k entries.

## Deploy

Railway redeploys on every push to `main`. After the first deploy:

1. App service → **Settings → Networking → Generate Domain** (or attach a custom domain)
2. Update `WIKI_BASE_URL` env to match
3. Register `https://<your-domain>/api/mcp` as a connector in Claude with `Authorization: Bearer <WIKI_BEARER_TOKEN>`

## Repo conventions

- Production branch: `main`
- Commits: phase-N for build phases, otherwise short imperative
- `.env.local` is ignored; `.env.local.example` is committed as a template
