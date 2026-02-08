-- CreateTable
CREATE TABLE "training_modules" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "content" JSONB,
    "resources" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_completions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpentMin" INTEGER,

    CONSTRAINT "training_completions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_certificates" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validityDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "training_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificate_requirements" (
    "certificateId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,

    CONSTRAINT "certificate_requirements_pkey" PRIMARY KEY ("certificateId","moduleId")
);

-- CreateTable
CREATE TABLE "certificate_issuances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certificateId" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "certificate_issuances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "training_modules_slug_key" ON "training_modules"("slug");

-- CreateIndex
CREATE INDEX "training_modules_category_idx" ON "training_modules"("category");

-- CreateIndex
CREATE INDEX "training_completions_userId_idx" ON "training_completions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "training_completions_userId_moduleId_key" ON "training_completions"("userId", "moduleId");

-- CreateIndex
CREATE INDEX "certificate_issuances_userId_idx" ON "certificate_issuances"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_issuances_userId_certificateId_key" ON "certificate_issuances"("userId", "certificateId");

-- AddForeignKey
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_completions" ADD CONSTRAINT "training_completions_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_requirements" ADD CONSTRAINT "certificate_requirements_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "training_certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_requirements" ADD CONSTRAINT "certificate_requirements_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "training_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_issuances" ADD CONSTRAINT "certificate_issuances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_issuances" ADD CONSTRAINT "certificate_issuances_certificateId_fkey" FOREIGN KEY ("certificateId") REFERENCES "training_certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
