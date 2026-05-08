---
description: Search the NEO Labs wiki for prior context
---

Use the **query-wiki** skill to search the NEO Labs wiki.

$ARGUMENTS

If `$ARGUMENTS` is non-empty, treat it as the search query (e.g. `/read-wiki bedrock model id`). Use it as the `query` parameter for `wiki_search`, and add tag filters when the topic clearly maps to a client/product/stack from the taxonomy.

If `$ARGUMENTS` is empty, call `wiki_list_recent` instead to show what's been touched lately.

Cite results with their entry URLs. Honestly report `similarity` scores — don't oversell weak matches. If nothing relevant comes back, say so explicitly.
