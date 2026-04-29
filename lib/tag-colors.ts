/**
 * Map a tag's namespace prefix to a muted color. Hand-picked, not algorithmic.
 * Used by both TagPill and the force graph node coloring.
 */
const PALETTE: Record<string, string> = {
  client: "#B5876C",   // warm tan
  product: "#A88B6E",  // sandy
  stack: "#6E8A99",    // dusty blue
  pattern: "#7C8471",  // sage (matches accent)
  gotcha: "#B66A6A",   // muted red
  lang: "#8C7CA8",     // dusty purple
};

const FALLBACK = "#8a8a8a";

export function tagNamespace(tag: string): string {
  const idx = tag.indexOf(":");
  return idx === -1 ? "" : tag.slice(0, idx);
}

export function tagColor(tag: string): string {
  return PALETTE[tagNamespace(tag)] ?? FALLBACK;
}

export function primaryNamespace(tags: string[]): string {
  for (const ns of ["client", "product", "stack", "pattern", "gotcha", "lang"]) {
    if (tags.some((t) => tagNamespace(t) === ns)) return ns;
  }
  return "";
}

export function primaryColor(tags: string[]): string {
  return PALETTE[primaryNamespace(tags)] ?? FALLBACK;
}
