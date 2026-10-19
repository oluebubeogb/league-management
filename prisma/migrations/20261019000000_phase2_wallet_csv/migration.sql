-- Phase 2: Wallet, Transaction, Prediction stakes, CsvImport

CREATE TYPE "TransactionType" AS ENUM ('PREDICTION_STAKE', 'PREDICTION_WIN', 'MOCK_DEPOSIT', 'ADMIN_ADJUST', 'BONUS', 'REFUND', 'STARTER');
CREATE TYPE "CsvEntity" AS ENUM ('TEAMS', 'PLAYERS', 'FIXTURES', 'SCORES', 'GROUPS');

ALTER TABLE "Prediction" ADD COLUMN IF NOT EXISTS "stakeAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Prediction" ADD COLUMN IF NOT EXISTS "potentialPayout" INTEGER;
ALTER TABLE "Prediction" ADD COLUMN IF NOT EXISTS "coinsAwarded" INTEGER;

CREATE TABLE IF NOT EXISTS "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_userId_key" ON "Wallet"("userId");

CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "TransactionType" NOT NULL,
    "referenceId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_type_idx" ON "Transaction"("type");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction"("createdAt");

CREATE TABLE IF NOT EXISTS "CsvImport" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "entity" "CsvEntity" NOT NULL,
    "uploadedByAdminId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "createdRows" INTEGER NOT NULL DEFAULT 0,
    "updatedRows" INTEGER NOT NULL DEFAULT 0,
    "skippedRows" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "reportJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CsvImport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "CsvImport_leagueId_idx" ON "CsvImport"("leagueId");
CREATE INDEX IF NOT EXISTS "CsvImport_entity_idx" ON "CsvImport"("entity");
CREATE INDEX IF NOT EXISTS "CsvImport_uploadedByAdminId_idx" ON "CsvImport"("uploadedByAdminId");

DO $$ BEGIN
  ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CsvImport" ADD CONSTRAINT "CsvImport_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "CsvImport" ADD CONSTRAINT "CsvImport_uploadedByAdminId_fkey" FOREIGN KEY ("uploadedByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
