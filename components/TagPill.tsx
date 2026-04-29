import { tagColor } from "@/lib/tag-colors";

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
  return (
    <Comp
      onClick={onClick}
      style={{
        borderColor: color,
        color: active ? "#fff" : color,
        backgroundColor: active ? color : "transparent",
      }}
      className={`inline-flex items-center text-[11px] leading-none px-2 py-1 rounded-full border transition-colors ${
        onClick ? "cursor-pointer hover:bg-[var(--surface)]" : ""
      }`}
    >
      {tag}
    </Comp>
  );
}
