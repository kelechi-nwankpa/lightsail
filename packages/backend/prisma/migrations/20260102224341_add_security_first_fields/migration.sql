-- AlterTable
ALTER TABLE "Control" ADD COLUMN     "verificationDetails" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "verificationSource" VARCHAR(100),
ADD COLUMN     "verificationStatus" VARCHAR(50) NOT NULL DEFAULT 'unverified',
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Evidence" ADD COLUMN     "isProvisional" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "ControlEffectivenessLog" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "effectivenessScore" DECIMAL(5,2) NOT NULL,
    "factors" JSONB NOT NULL DEFAULT '{}',
    "triggeredBy" VARCHAR(100),
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ControlEffectivenessLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ControlEffectivenessLog_controlId_idx" ON "ControlEffectivenessLog"("controlId");

-- CreateIndex
CREATE INDEX "ControlEffectivenessLog_controlId_calculatedAt_idx" ON "ControlEffectivenessLog"("controlId", "calculatedAt");

-- CreateIndex
CREATE INDEX "Control_organizationId_verificationStatus_idx" ON "Control"("organizationId", "verificationStatus");

-- AddForeignKey
ALTER TABLE "ControlEffectivenessLog" ADD CONSTRAINT "ControlEffectivenessLog_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;
