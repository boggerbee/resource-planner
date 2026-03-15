CREATE TABLE "SystemSettings" (
  "id" TEXT NOT NULL DEFAULT 'singleton',
  "defaultInternalHourlyRate" DECIMAL(10,2),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);
INSERT INTO "SystemSettings" ("id", "updatedAt") VALUES ('singleton', NOW()) ON CONFLICT DO NOTHING;
