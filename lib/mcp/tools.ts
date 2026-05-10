import { z } from "zod";
import {
  createEntry,
  updateEntry,
  getEntry,
  searchEntries,
  listRecent,
} from "../wiki";
import { prisma } from "../db";

const BASE_URL = process.env.WIKI_BASE_URL ?? "http://localhost:3000";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

export const toolDefinitions: ToolDefinition[] = [
  {
    name: "wiki_search",
    description:
      "Search the wiki by semantic meaning and/or tags. Use BEFORE answering questions where prior context might exist (e.g. 'have we dealt with X before', 'how did we set up Y'). Returns entries ranked by relevance.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Natural language search query. Optional — if omitted, returns recent entries matching tags.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description:
            "Optional namespaced tags to filter by, e.g. ['client:mikenta', 'stack:webflow'].",
        },
        limit: {
          type: "number",
          description: "Max results (default 10, max 50).",
        },
      },
    },
    handler: async (args) => {
      const input = z
        .object({
          query: z.string().optional(),
          tags: z.array(z.string()).optional(),
          limit: z.number().optional(),
        })
        .parse(args);
      const results = await searchEntries(input);
      return {
        results: results.map((r) => ({
          id: r.id,
          title: r.title,
          tags: r.tags,
          flavor: r.flavor,
          similarity: Number(r.similarity?.toFixed(3) ?? 0),
          preview: r.content.slice(0, 300),
          url: `${BASE_URL}/entry/${r.id}`,
          updatedAt: r.updatedAt,
        })),
      };
    },
  },

  {
    name: "wiki_get",
    description: "Fetch the full content of one wiki entry by id.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
    handler: async (args) => {
      const { id } = z.object({ id: z.string() }).parse(args);
      const entry = await getEntry(id);
      if (!entry) return { error: "Not found" };
      return {
        id: entry.id,
        title: entry.title,
        content: entry.content,
        tags: entry.tags,
        flavor: entry.flavor,
        url: `${BASE_URL}/entry/${entry.id}`,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        linkedEntries: [
          ...entry.linksFrom.map((l) => ({
            id: l.to.id,
            title: l.to.title,
            kind: l.kind,
            direction: "outgoing" as const,
          })),
          ...entry.linksTo.map((l) => ({
            id: l.from.id,
            title: l.from.title,
            kind: l.kind,
            direction: "incoming" as const,
          })),
        ],
      };
    },
  },

  {
    name: "wiki_write",
    description:
      "Create a new wiki entry. Use when the user says 'save this', 'add to wiki', or after substantive problem-solving worth preserving. Default flavor is NOTEBOOK (timestamped, append-only). Use DISTILLED only when explicitly asked.",
    inputSchema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description:
            "Concrete and searchable. e.g. 'Bedrock EU model ID format' not 'AWS notes'.",
        },
        content: {
          type: "string",
          description:
            "Markdown body. Recommended structure: Context, What we tried, What worked, Gotchas, Code (if relevant).",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description:
            "Namespaced tags. At least one of: client:*, product:*. Plus stack:* and pattern:* or gotcha:* as relevant.",
        },
        flavor: { type: "string", enum: ["NOTEBOOK", "DISTILLED"] },
      },
      required: ["title", "content", "tags"],
    },
    handler: async (args) => {
      const input = z
        .object({
          title: z.string().min(1),
          content: z.string().min(1),
          tags: z.array(z.string()).min(1),
          flavor: z.enum(["NOTEBOOK", "DISTILLED"]).optional(),
        })
        .parse(args);
      const entry = await createEntry(input);
      return {
        id: entry.id,
        url: `${BASE_URL}/entry/${entry.id}`,
        title: entry.title,
      };
    },
  },

  {
    name: "wiki_update",
    description:
      "Update an existing entry. Use when extending a NOTEBOOK entry with new findings, or revising a DISTILLED entry. Re-embeds automatically if content changes.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        title: { type: "string" },
        content: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        flavor: { type: "string", enum: ["NOTEBOOK", "DISTILLED"] },
      },
      required: ["id"],
    },
    handler: async (args) => {
      const input = z
        .object({
          id: z.string(),
          title: z.string().optional(),
          content: z.string().optional(),
          tags: z.array(z.string()).optional(),
          flavor: z.enum(["NOTEBOOK", "DISTILLED"]).optional(),
        })
        .parse(args);
      const entry = await updateEntry(input);
      return {
        id: entry.id,
        url: `${BASE_URL}/entry/${entry.id}`,
        title: entry.title,
      };
    },
  },

  {
    name: "wiki_tags",
    description:
      "Discover the live tag vocabulary in use across the wiki. Returns every distinct tag with its usage count, sorted by count then alphabetical. Use this BEFORE proposing tags for a new entry so you can reuse existing values when they fit. The tag space is free-form (Postgres text[]); new values are introduced by simply using them via wiki_write — no schema migration required. So this tool's output is the current state of the folksonomy, not a closed allow-list.",
    inputSchema: {
      type: "object",
      properties: {
        namespace: {
          type: "string",
          description:
            "Optional: filter to one namespace prefix (e.g. 'gotcha' returns only tags like 'gotcha:rate-limit'). Omit to see all.",
        },
      },
    },
    handler: async (args) => {
      const input = z
        .object({ namespace: z.string().optional() })
        .parse(args);
      const rows = await prisma.$queryRawUnsafe<
        { tag: string; count: bigint }[]
      >(
        `SELECT t AS tag, COUNT(*)::bigint AS count
         FROM "Entry", unnest(tags) t
         ${input.namespace ? `WHERE t LIKE $1` : ``}
         GROUP BY t
         ORDER BY count DESC, tag ASC`,
        ...(input.namespace ? [`${input.namespace}:%`] : [])
      );
      return {
        tags: rows.map((r) => ({ tag: r.tag, count: Number(r.count) })),
        note: "Tags are free-form. To introduce a new value, just use it in wiki_write — it'll appear here next time. The skill's namespace definitions are the only durable rule; specific values are emergent.",
      };
    },
  },

  {
    name: "wiki_list_recent",
    description:
      "List recently updated entries. Use to orient at the start of a session ('what have we touched lately') or to find an entry by recency rather than topic.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number" },
        tags: { type: "array", items: { type: "string" } },
      },
    },
    handler: async (args) => {
      const input = z
        .object({
          limit: z.number().optional(),
          tags: z.array(z.string()).optional(),
        })
        .parse(args);
      const entries = await listRecent(input);
      return {
        entries: entries.map((e) => ({
          id: e.id,
          title: e.title,
          tags: e.tags,
          flavor: e.flavor,
          updatedAt: e.updatedAt,
          url: `${BASE_URL}/entry/${e.id}`,
        })),
      };
    },
  },
];
