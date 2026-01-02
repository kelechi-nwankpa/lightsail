-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL DEFAULT 'operational',
    "status" VARCHAR(50) NOT NULL DEFAULT 'identified',
    "likelihood" VARCHAR(50) NOT NULL DEFAULT 'possible',
    "impact" VARCHAR(50) NOT NULL DEFAULT 'moderate',
    "inherentScore" INTEGER,
    "residualScore" INTEGER,
    "ownerId" TEXT,
    "mitigationPlan" TEXT,
    "acceptanceNotes" TEXT,
    "dueDate" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskControlLink" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "effectiveness" VARCHAR(50) NOT NULL DEFAULT 'partial',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskControlLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Risk_organizationId_idx" ON "Risk"("organizationId");

-- CreateIndex
CREATE INDEX "Risk_organizationId_status_idx" ON "Risk"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Risk_organizationId_category_idx" ON "Risk"("organizationId", "category");

-- CreateIndex
CREATE INDEX "Risk_ownerId_idx" ON "Risk"("ownerId");

-- CreateIndex
CREATE INDEX "RiskControlLink_riskId_idx" ON "RiskControlLink"("riskId");

-- CreateIndex
CREATE INDEX "RiskControlLink_controlId_idx" ON "RiskControlLink"("controlId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskControlLink_riskId_controlId_key" ON "RiskControlLink"("riskId", "controlId");

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskControlLink" ADD CONSTRAINT "RiskControlLink_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskControlLink" ADD CONSTRAINT "RiskControlLink_controlId_fkey" FOREIGN KEY ("controlId") REFERENCES "Control"("id") ON DELETE CASCADE ON UPDATE CASCADE;
