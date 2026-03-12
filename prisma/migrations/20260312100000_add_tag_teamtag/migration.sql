-- CreateTable
CREATE TABLE "Tag" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "color"     TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateTable
CREATE TABLE "TeamTag" (
  "teamId" TEXT NOT NULL,
  "tagId"  TEXT NOT NULL,
  CONSTRAINT "TeamTag_pkey" PRIMARY KEY ("teamId", "tagId"),
  CONSTRAINT "TeamTag_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TeamTag_tagId_fkey"  FOREIGN KEY ("tagId")  REFERENCES "Tag"("id")  ON DELETE CASCADE ON UPDATE CASCADE
);
