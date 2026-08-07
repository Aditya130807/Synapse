-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('uploaded', 'processing', 'processed', 'failed');

-- CreateTable
CREATE TABLE "KnowledgeFile" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "status" "FileStatus" NOT NULL DEFAULT 'uploaded',
    "lastAccessedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "tokenCount" INTEGER,
    "pageCount" INTEGER,
    "language" TEXT,
    "summary" TEXT,
    "vectorNamespace" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KnowledgeFile_userId_idx" ON "KnowledgeFile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeFile_userId_hash_key" ON "KnowledgeFile"("userId", "hash");

-- AddForeignKey
ALTER TABLE "KnowledgeFile" ADD CONSTRAINT "KnowledgeFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
