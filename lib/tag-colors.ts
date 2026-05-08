/**
 * Map a tag's namespace prefix to a muted color. Hand-picked, not algorithmic.
 * Used by both TagPill and the force graph node coloring.
 */
const PALETTE: Record<string, string> = {
  client: "#C2410C",   // burnt orange
  product: "#0E7490",  // teal
  stack: "#1D4ED8",    // strong blue
  pattern: "#15803D",  // forest green
  gotcha: "#B91C1C",   // strong red
  lang: "#7E22CE",     // strong purple
};

const FALLBACK = "#525252";

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
