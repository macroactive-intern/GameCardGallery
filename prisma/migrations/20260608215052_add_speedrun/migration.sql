-- CreateTable
CREATE TABLE "SpeedrunGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SpeedrunCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "splitNames" TEXT NOT NULL,
    CONSTRAINT "SpeedrunCategory_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "SpeedrunGame" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpeedrunRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "categoryId" TEXT NOT NULL,
    "splitTimes" TEXT NOT NULL,
    "totalTime" INTEGER NOT NULL,
    "goldSplits" TEXT NOT NULL,
    "shareToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SpeedrunRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SpeedrunRun_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "SpeedrunCategory" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SpeedrunGame_slug_key" ON "SpeedrunGame"("slug");

-- CreateIndex
CREATE INDEX "SpeedrunGame_name_idx" ON "SpeedrunGame"("name");

-- CreateIndex
CREATE INDEX "SpeedrunCategory_gameId_idx" ON "SpeedrunCategory"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeedrunCategory_gameId_name_key" ON "SpeedrunCategory"("gameId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SpeedrunRun_shareToken_key" ON "SpeedrunRun"("shareToken");

-- CreateIndex
CREATE INDEX "SpeedrunRun_categoryId_totalTime_idx" ON "SpeedrunRun"("categoryId", "totalTime");

-- CreateIndex
CREATE INDEX "SpeedrunRun_userId_categoryId_idx" ON "SpeedrunRun"("userId", "categoryId");
