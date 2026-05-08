---
description: Save current findings to the NEO Labs wiki
---

Use the **save-to-wiki** skill to capture what we've worked on this session.

$ARGUMENTS

Follow the skill's structure: Context, What we tried, What worked, What didn't and why, Gotchas, Code. Tag with the appropriate `client:`, `product:`, `stack:`, `pattern:`, `gotcha:`, or `lang:` prefixes from the taxonomy. Default flavor is NOTEBOOK unless I explicitly ask for DISTILLED. After writing, paste back the entry URL.

If `$ARGUMENTS` is empty, infer the entry from the current conversation. If it's non-empty, treat it as a hint about what the entry should focus on (e.g. `/save-wiki the bedrock thing` → focus on the Bedrock-related findings).
