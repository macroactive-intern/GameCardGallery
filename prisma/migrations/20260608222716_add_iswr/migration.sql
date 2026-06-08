-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SpeedrunRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "categoryId" TEXT NOT NULL,
    "splitTimes" TEXT NOT NULL,
    "totalTime" INTEGER NOT NULL,
    "goldSplits" TEXT NOT NULL,
    "isWR" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpeedrunRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SpeedrunRun_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SpeedrunCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SpeedrunRun" ("categoryId", "createdAt", "goldSplits", "id", "shareToken", "splitTimes", "totalTime", "userId") SELECT "categoryId", "createdAt", "goldSplits", "id", "shareToken", "splitTimes", "totalTime", "userId" FROM "SpeedrunRun";
DROP TABLE "SpeedrunRun";
ALTER TABLE "new_SpeedrunRun" RENAME TO "SpeedrunRun";
CREATE UNIQUE INDEX "SpeedrunRun_shareToken_key" ON "SpeedrunRun"("shareToken");
CREATE INDEX "SpeedrunRun_categoryId_totalTime_idx" ON "SpeedrunRun"("categoryId", "totalTime");
CREATE INDEX "SpeedrunRun_userId_categoryId_idx" ON "SpeedrunRun"("userId", "categoryId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
