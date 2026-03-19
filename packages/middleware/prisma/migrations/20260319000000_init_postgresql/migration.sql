-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'UNPAID', 'TRIALING');

-- CreateTable
CREATE TABLE "zs_user" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(191) NOT NULL,
    "name" VARCHAR(191),
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT,

    CONSTRAINT "zs_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_user_setting" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "settingKey" VARCHAR(191) NOT NULL,
    "settingValue" TEXT NOT NULL,

    CONSTRAINT "zs_user_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_team" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "tenantId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "salt" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "externalCustomerId" TEXT,
    "referredBy" TEXT,
    "parentId" TEXT,

    CONSTRAINT "zs_team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_team_setting" (
    "id" SERIAL NOT NULL,
    "settingKey" VARCHAR(191) NOT NULL,
    "settingValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "zs_team_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_team_role" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acl" JSONB,
    "canManageTeam" BOOLEAN NOT NULL DEFAULT false,
    "isOwnerRole" BOOLEAN NOT NULL DEFAULT false,
    "teamId" TEXT NOT NULL,

    CONSTRAINT "zs_team_role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_user_team_role" (
    "userId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "userSpecificAcl" JSONB,
    "isTeamInitiator" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "zs_user_team_role_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "zs_subscription" (
    "id" TEXT NOT NULL,
    "stripeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" "SubscriptionStatus" NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "properties" JSONB,
    "planId" INTEGER NOT NULL,
    "object" JSONB,

    CONSTRAINT "zs_subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_plan" (
    "id" SERIAL NOT NULL,
    "stripeId" TEXT NOT NULL,
    "priceId" TEXT NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "friendlyName" TEXT,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT true,
    "isDefaultPlan" BOOLEAN NOT NULL DEFAULT false,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "HTMLDescription" TEXT,
    "HTMLFeatures" TEXT,
    "isCustomPlan" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "zs_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_ai_agent" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(191) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "salt" TEXT NOT NULL,
    "teamId" TEXT,
    "lockId" TEXT,
    "lockAt" TIMESTAMP(3),
    "lockedByName" TEXT,
    "lastLockBeat" TIMESTAMP(3),
    "lastLockSaveOperation" TIMESTAMP(3),

    CONSTRAINT "zs_ai_agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_ai_agent_activity" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT,
    "name" VARCHAR(191) NOT NULL,
    "userId" INTEGER,
    "aiAgentId" TEXT NOT NULL,

    CONSTRAINT "zs_ai_agent_activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_ai_agent_contributor" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "isCreator" BOOLEAN NOT NULL DEFAULT false,
    "aiAgentId" TEXT NOT NULL,

    CONSTRAINT "zs_ai_agent_contributor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_ai_agent_settings" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(191) NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiAgentId" TEXT NOT NULL,

    CONSTRAINT "zs_ai_agent_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_ai_agent_data" (
    "id" SERIAL NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiAgentId" TEXT NOT NULL,

    CONSTRAINT "zs_ai_agent_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_ai_agent_deployment" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiAgentId" TEXT NOT NULL,
    "aiAgentSettings" JSONB,
    "aiAgentData" JSONB,
    "majorVersion" INTEGER NOT NULL,
    "minorVersion" INTEGER NOT NULL,
    "releaseNotes" TEXT,

    CONSTRAINT "zs_ai_agent_deployment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_ai_agent_state" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(191) NOT NULL,
    "value" VARCHAR(191) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiAgentId" TEXT NOT NULL,

    CONSTRAINT "zs_ai_agent_state_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_embodiment" (
    "id" SERIAL NOT NULL,
    "type" VARCHAR(191) NOT NULL,
    "properties" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "aiAgentId" TEXT NOT NULL,

    CONSTRAINT "zs_embodiment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zs_ai_agent_conversation" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "summary" TEXT,
    "chunkSize" INTEGER,
    "lastChunkID" TEXT,
    "aiAgentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "ownerId" INTEGER,

    CONSTRAINT "zs_ai_agent_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "zs_user_email_key" ON "zs_user"("email");

-- CreateIndex
CREATE INDEX "zs_user_email_idx" ON "zs_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "zs_user_setting_userId_settingKey_key" ON "zs_user_setting"("userId", "settingKey");

-- CreateIndex
CREATE UNIQUE INDEX "zs_team_tenantId_key" ON "zs_team"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "zs_team_salt_key" ON "zs_team"("salt");

-- CreateIndex
CREATE INDEX "zs_team_externalCustomerId_idx" ON "zs_team"("externalCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "zs_team_setting_teamId_settingKey_key" ON "zs_team_setting"("teamId", "settingKey");

-- CreateIndex
CREATE UNIQUE INDEX "zs_team_role_teamId_id_key" ON "zs_team_role"("teamId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "zs_plan_name_key" ON "zs_plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "zs_ai_agent_salt_key" ON "zs_ai_agent"("salt");

-- CreateIndex
CREATE UNIQUE INDEX "zs_ai_agent_teamId_id_key" ON "zs_ai_agent"("teamId", "id");

-- CreateIndex
CREATE INDEX "zs_ai_agent_createdAt_idx" ON "zs_ai_agent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "zs_ai_agent_contributor_userId_aiAgentId_key" ON "zs_ai_agent_contributor"("userId", "aiAgentId");

-- CreateIndex
CREATE UNIQUE INDEX "zs_ai_agent_data_aiAgentId_key" ON "zs_ai_agent_data"("aiAgentId");

-- CreateIndex
CREATE UNIQUE INDEX "zs_ai_agent_deployment_aiAgentId_majorVersion_minorVersion_key" ON "zs_ai_agent_deployment"("aiAgentId", "majorVersion", "minorVersion");

-- CreateIndex
CREATE INDEX "zs_ai_agent_deployment_id_aiAgentId_idx" ON "zs_ai_agent_deployment"("id", "aiAgentId");

-- AddForeignKey
ALTER TABLE "zs_user" ADD CONSTRAINT "zs_user_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "zs_team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_user_setting" ADD CONSTRAINT "zs_user_setting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "zs_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_team" ADD CONSTRAINT "zs_team_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "zs_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_team" ADD CONSTRAINT "zs_team_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "zs_team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_team_setting" ADD CONSTRAINT "zs_team_setting_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "zs_team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_team_role" ADD CONSTRAINT "zs_team_role_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "zs_team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_user_team_role" ADD CONSTRAINT "zs_user_team_role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "zs_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_user_team_role" ADD CONSTRAINT "zs_user_team_role_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "zs_team_role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_subscription" ADD CONSTRAINT "zs_subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "zs_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_ai_agent" ADD CONSTRAINT "zs_ai_agent_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "zs_team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_ai_agent_activity" ADD CONSTRAINT "zs_ai_agent_activity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "zs_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_ai_agent_activity" ADD CONSTRAINT "zs_ai_agent_activity_aiAgentId_fkey" FOREIGN KEY ("aiAgentId") REFERENCES "zs_ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_ai_agent_contributor" ADD CONSTRAINT "zs_ai_agent_contributor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "zs_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_ai_agent_contributor" ADD CONSTRAINT "zs_ai_agent_contributor_aiAgentId_fkey" FOREIGN KEY ("aiAgentId") REFERENCES "zs_ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_ai_agent_settings" ADD CONSTRAINT "zs_ai_agent_settings_aiAgentId_fkey" FOREIGN KEY ("aiAgentId") REFERENCES "zs_ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_ai_agent_data" ADD CONSTRAINT "zs_ai_agent_data_aiAgentId_fkey" FOREIGN KEY ("aiAgentId") REFERENCES "zs_ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_ai_agent_deployment" ADD CONSTRAINT "zs_ai_agent_deployment_aiAgentId_fkey" FOREIGN KEY ("aiAgentId") REFERENCES "zs_ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_ai_agent_state" ADD CONSTRAINT "zs_ai_agent_state_aiAgentId_fkey" FOREIGN KEY ("aiAgentId") REFERENCES "zs_ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_embodiment" ADD CONSTRAINT "zs_embodiment_aiAgentId_fkey" FOREIGN KEY ("aiAgentId") REFERENCES "zs_ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_ai_agent_conversation" ADD CONSTRAINT "zs_ai_agent_conversation_aiAgentId_fkey" FOREIGN KEY ("aiAgentId") REFERENCES "zs_ai_agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_ai_agent_conversation" ADD CONSTRAINT "zs_ai_agent_conversation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "zs_team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zs_ai_agent_conversation" ADD CONSTRAINT "zs_ai_agent_conversation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "zs_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
