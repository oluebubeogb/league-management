-- Allow multiple predictions per user/match/type
DROP INDEX IF EXISTS "Prediction_userId_matchId_type_key";
CREATE INDEX IF NOT EXISTS "Prediction_userId_matchId_type_idx" ON "Prediction"("userId", "matchId", "type");
