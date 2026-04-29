-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "Flavor" AS ENUM ('NOTEBOOK', 'DISTILLED');

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "flavor" "Flavor" NOT NULL DEFAULT 'NOTEBOOK',
    "tags" TEXT[],
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Link" (
    "id" TEXT NOT NULL,
    "fromId" TEXT NOT NULL,
    "toId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Entry_tags_idx" ON "Entry" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "Entry_updatedAt_idx" ON "Entry"("updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Link_fromId_idx" ON "Link"("fromId");

-- CreateIndex
CREATE INDEX "Link_toId_idx" ON "Link"("toId");

-- CreateIndex
CREATE UNIQUE INDEX "Link_fromId_toId_kind_key" ON "Link"("fromId", "toId", "kind");

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Link" ADD CONSTRAINT "Link_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
