-- CreateTable
CREATE TABLE "LiveRevision" (
    "topic" TEXT NOT NULL,
    "revision" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveRevision_pkey" PRIMARY KEY ("topic")
);
