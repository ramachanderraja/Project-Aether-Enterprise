-- CreateTable
CREATE TABLE "pipeline_snapshots" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL DEFAULT 'default',
    "snapshotMonth" DATE NOT NULL,
    "hubspotDealId" TEXT NOT NULL,
    "dealName" TEXT NOT NULL,
    "customerName" TEXT NOT NULL DEFAULT '',
    "dealValue" DECIMAL(18,2) NOT NULL,
    "licenseAcv" DECIMAL(18,2) NOT NULL,
    "implementationValue" DECIMAL(18,2) NOT NULL,
    "logoType" TEXT,
    "dealStage" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL DEFAULT '',
    "probability" DECIMAL(5,2) NOT NULL,
    "expectedCloseDate" DATE,
    "region" TEXT,
    "vertical" TEXT,
    "segment" TEXT,
    "productSubCategory" TEXT,
    "salesRep" TEXT,
    "ownerSalesTeam" TEXT,
    "createdDate" DATE,
    "hubspotOwnerId" TEXT,
    "rawDealStageId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'hubspot',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pipeline_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubspot_sync_logs" (
    "id" TEXT NOT NULL,
    "syncType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "recordsFetched" INTEGER NOT NULL DEFAULT 0,
    "recordsUpserted" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" JSONB,

    CONSTRAINT "hubspot_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubspot_stage_mappings" (
    "id" TEXT NOT NULL,
    "pipelineId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "stageLabel" TEXT NOT NULL,
    "probability" DECIMAL(5,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hubspot_stage_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pipeline_snapshots_tenantId_snapshotMonth_idx" ON "pipeline_snapshots"("tenantId", "snapshotMonth");

-- CreateIndex
CREATE INDEX "pipeline_snapshots_hubspotDealId_idx" ON "pipeline_snapshots"("hubspotDealId");

-- CreateIndex
CREATE UNIQUE INDEX "pipeline_snapshots_snapshotMonth_hubspotDealId_key" ON "pipeline_snapshots"("snapshotMonth", "hubspotDealId");

-- CreateIndex
CREATE INDEX "hubspot_sync_logs_syncType_startedAt_idx" ON "hubspot_sync_logs"("syncType", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "hubspot_stage_mappings_pipelineId_stageId_key" ON "hubspot_stage_mappings"("pipelineId", "stageId");
