-- AlterEnum
ALTER TYPE "AuditEventType" ADD VALUE 'TRANSFER_SENT';

-- CreateTable
CREATE TABLE "beneficiaries" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "beneficiaries_ownerUserId_idx" ON "beneficiaries"("ownerUserId");

-- CreateIndex
CREATE UNIQUE INDEX "beneficiaries_ownerUserId_identifier_key" ON "beneficiaries"("ownerUserId", "identifier");

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
