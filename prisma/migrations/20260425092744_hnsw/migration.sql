-- HNSW index for cosine similarity over OpenAI embeddings.
-- Prisma can't express HNSW indexes natively, so this is a manual migration.

CREATE INDEX IF NOT EXISTS entry_embedding_hnsw_idx
  ON "Entry"
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
