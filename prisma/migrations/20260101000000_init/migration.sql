-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FAN', 'ADMIN', 'PRIMARY_ADMIN');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'LIVE', 'HALF_TIME', 'FULL_TIME', 'POSTPONED', 'CANCELLED');
CREATE TYPE "MatchStage" AS ENUM ('GROUP', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL');
CREATE TYPE "EventType" AS ENUM ('GOAL', 'OWN_GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION');
CREATE TYPE "PredictionType" AS ENUM ('OUTCOME', 'DOUBLE_CHANCE', 'CORRECT_SCORE', 'TOTAL_GOALS', 'BTTS');
CREATE TYPE "PredictionStatus" AS ENUM ('ACTIVE', 'CLOSED', 'GRADED');
CREATE TYPE "AIAnalysisType" AS ENUM ('PREVIEW', 'POST_MATCH', 'TOURNAMENT_SUMMARY', 'GROUP_OUTLOOK');
CREATE TYPE "AIStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'STALE', 'FAILED');
CREATE TYPE "AIJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED');
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PREVIEWED', 'COMMITTED', 'FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "normalizedUsername" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "normalizedPhone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "birthYear" INTEGER,
    "role" "Role" NOT NULL DEFAULT 'FAN',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecoveryToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecoveryToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Group" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "position" TEXT,
    "age" INTEGER,
    "dateOfBirth" TIMESTAMP(3),
    "phone" TEXT,
    "jerseyNumber" INTEGER,
    "nationality" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "stage" "MatchStage" NOT NULL DEFAULT 'GROUP',
    "groupId" TEXT,
    "homeTeamId" TEXT,
    "awayTeamId" TEXT,
    "homeSlot" TEXT,
    "awaySlot" TEXT,
    "slotCode" TEXT,
    "kickoffAt" TIMESTAMP(3),
    "venue" TEXT,
    "status" "MatchStatus" NOT NULL DEFAULT 'SCHEDULED',
    "halfTimeHomeScore" INTEGER,
    "halfTimeAwayScore" INTEGER,
    "fullTimeHomeScore" INTEGER,
    "fullTimeAwayScore" INTEGER,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "predictionCutoffAt" TIMESTAMP(3),
    "matchday" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchEvent" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT,
    "playerId" TEXT,
    "relatedPlayerId" TEXT,
    "eventType" "EventType" NOT NULL,
    "minute" INTEGER,
    "addedTime" INTEGER,
    "ownGoal" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MatchEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "type" "PredictionType" NOT NULL,
    "selectedOutcome" TEXT,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "comment" TEXT,
    "status" "PredictionStatus" NOT NULL DEFAULT 'ACTIVE',
    "isCorrect" BOOLEAN,
    "pointsAwarded" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIAnalysis" (
    "id" TEXT NOT NULL,
    "matchId" TEXT,
    "analysisType" "AIAnalysisType" NOT NULL,
    "model" TEXT,
    "promptVersion" TEXT,
    "sourceSnapshot" TEXT,
    "content" TEXT NOT NULL,
    "structured" TEXT,
    "status" "AIStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "publishedAt" TIMESTAMP(3),
    "stale" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIAnalysis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AIJob" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" "AIJobStatus" NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorAdminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlayerImport" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "uploadedByAdminId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "validRows" INTEGER NOT NULL DEFAULT 0,
    "invalidRows" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "reportJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerImport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- Indexes & constraints
CREATE UNIQUE INDEX "User_normalizedUsername_key" ON "User"("normalizedUsername");
CREATE UNIQUE INDEX "User_normalizedPhone_key" ON "User"("normalizedPhone");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_status_idx" ON "User"("status");

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

CREATE UNIQUE INDEX "RecoveryToken_tokenHash_key" ON "RecoveryToken"("tokenHash");
CREATE INDEX "RecoveryToken_userId_idx" ON "RecoveryToken"("userId");

CREATE UNIQUE INDEX "Group_code_key" ON "Group"("code");

CREATE UNIQUE INDEX "Team_slug_key" ON "Team"("slug");
CREATE INDEX "Team_groupId_idx" ON "Team"("groupId");

CREATE UNIQUE INDEX "Player_teamId_normalizedName_key" ON "Player"("teamId", "normalizedName");
CREATE INDEX "Player_teamId_idx" ON "Player"("teamId");
CREATE INDEX "Player_normalizedName_idx" ON "Player"("normalizedName");

CREATE INDEX "Match_status_idx" ON "Match"("status");
CREATE INDEX "Match_stage_idx" ON "Match"("stage");
CREATE INDEX "Match_groupId_idx" ON "Match"("groupId");
CREATE INDEX "Match_kickoffAt_idx" ON "Match"("kickoffAt");
CREATE INDEX "Match_homeTeamId_idx" ON "Match"("homeTeamId");
CREATE INDEX "Match_awayTeamId_idx" ON "Match"("awayTeamId");

CREATE INDEX "MatchEvent_matchId_idx" ON "MatchEvent"("matchId");
CREATE INDEX "MatchEvent_playerId_idx" ON "MatchEvent"("playerId");

CREATE UNIQUE INDEX "Prediction_userId_matchId_type_key" ON "Prediction"("userId", "matchId", "type");
CREATE INDEX "Prediction_matchId_idx" ON "Prediction"("matchId");
CREATE INDEX "Prediction_userId_idx" ON "Prediction"("userId");
CREATE INDEX "Prediction_status_idx" ON "Prediction"("status");

CREATE INDEX "AIAnalysis_matchId_idx" ON "AIAnalysis"("matchId");
CREATE INDEX "AIAnalysis_status_idx" ON "AIAnalysis"("status");
CREATE INDEX "AIAnalysis_analysisType_idx" ON "AIAnalysis"("analysisType");

CREATE INDEX "AIJob_status_availableAt_idx" ON "AIJob"("status", "availableAt");

CREATE INDEX "AdminAuditLog_actorAdminId_idx" ON "AdminAuditLog"("actorAdminId");
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

CREATE INDEX "PlayerImport_teamId_idx" ON "PlayerImport"("teamId");

CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- Foreign keys
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecoveryToken" ADD CONSTRAINT "RecoveryToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Team" ADD CONSTRAINT "Team_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Player" ADD CONSTRAINT "Player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Match" ADD CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_relatedPlayerId_fkey" FOREIGN KEY ("relatedPlayerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MatchEvent" ADD CONSTRAINT "MatchEvent_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AIAnalysis" ADD CONSTRAINT "AIAnalysis_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorAdminId_fkey" FOREIGN KEY ("actorAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlayerImport" ADD CONSTRAINT "PlayerImport_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlayerImport" ADD CONSTRAINT "PlayerImport_uploadedByAdminId_fkey" FOREIGN KEY ("uploadedByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
