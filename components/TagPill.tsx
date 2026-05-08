import { tagColor } from "@/lib/tag-colors";

/** Append `aa` to a 6-digit hex for ~67% alpha — used as the tinted bg. */
function withAlpha(hex: string, alphaHex: string) {
  return `${hex}${alphaHex}`;
}

export function TagPill({
  tag,
  onClick,
  active,
}: {
  tag: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const color = tagColor(tag);
  const Comp = onClick ? "button" : "span";
  // Active: solid color background, white text.
  // Inactive: light tint background (~14% alpha) with full-saturation text.
  const bg = active ? color : withAlpha(color, "22");
  const fg = active ? "#fff" : color;
  return (
    <Comp
      onClick={onClick}
      style={{
        borderColor: color,
        color: fg,
        backgroundColor: bg,
      }}
      className={`inline-flex items-center text-[11px] leading-none px-2 py-1 rounded-full border font-medium transition-colors ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {tag}
    </Comp>
  );
}
