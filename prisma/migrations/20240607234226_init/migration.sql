-- CreateTable
CREATE TABLE "application" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "status" TEXT,
    "data" TEXT,
    "user" INTEGER,

    CONSTRAINT "application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archive" (
    "id" SERIAL NOT NULL,
    "createdAt" BIGINT,
    "fromModel" TEXT,
    "originalRecord" JSON,
    "originalRecordId" JSON,

    CONSTRAINT "archive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ballotcandidate" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "firstName" TEXT,
    "middleName" TEXT,
    "lastName" TEXT,
    "state" TEXT,
    "parsedLocation" TEXT,
    "positionName" TEXT,
    "normalizedPositionName" TEXT,
    "data" JSON,
    "email" TEXT,
    "phone" TEXT,
    "candidateId" TEXT,
    "raceId" TEXT,
    "positionId" TEXT,
    "electionId" TEXT,
    "parties" TEXT,
    "electionName" TEXT,
    "electionDay" TEXT,
    "electionResult" TEXT,
    "level" TEXT,
    "tier" TEXT,
    "isJudicial" BOOLEAN,
    "isRetention" BOOLEAN,
    "isPrimary" BOOLEAN,
    "isRunoff" BOOLEAN,
    "isUnexpired" BOOLEAN,
    "campaign" INTEGER,

    CONSTRAINT "ballotcandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ballotcandidate_elections__ballotelection_candidates" (
    "id" SERIAL NOT NULL,
    "ballotcandidate_elections" INTEGER,
    "ballotelection_candidates" INTEGER,

    CONSTRAINT "ballotcandidate_elections__ballotelection_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ballotcandidate_positions__ballotposition_candidates" (
    "id" SERIAL NOT NULL,
    "ballotcandidate_positions" INTEGER,
    "ballotposition_candidates" INTEGER,

    CONSTRAINT "ballotcandidate_positions__ballotposition_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ballotcandidate_races__ballotrace_candidates" (
    "id" SERIAL NOT NULL,
    "ballotcandidate_races" INTEGER,
    "ballotrace_candidates" INTEGER,

    CONSTRAINT "ballotcandidate_races__ballotrace_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ballotelection" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "ballotId" TEXT,
    "ballotHashId" TEXT,
    "electionDate" REAL,
    "state" TEXT,
    "data" JSON,

    CONSTRAINT "ballotelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ballotposition" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "ballotId" TEXT,
    "ballotHashId" TEXT,
    "data" JSON,
    "ballotElection" INTEGER,

    CONSTRAINT "ballotposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ballotrace" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "ballotId" TEXT,
    "ballotHashId" TEXT,
    "hashId" TEXT,
    "positionSlug" TEXT,
    "state" TEXT,
    "electionDate" REAL,
    "level" TEXT,
    "subAreaName" TEXT,
    "subAreaValue" TEXT,
    "isJudicial" BOOLEAN,
    "isPrimary" BOOLEAN,
    "data" JSON,
    "county" INTEGER,
    "municipality" INTEGER,

    CONSTRAINT "ballotrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "isActive" BOOLEAN,
    "data" JSON,
    "dataCopy" JSON,
    "details" JSONB,
    "aiContent" JSONB,
    "isVerified" BOOLEAN,
    "dateVerified" DATE,
    "tier" TEXT,
    "isPro" BOOLEAN,
    "didWin" BOOLEAN,
    "user" INTEGER,
    "pathToVictory" INTEGER,

    CONSTRAINT "campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_positions__position_campaigns" (
    "id" SERIAL NOT NULL,
    "campaign_positions" INTEGER,
    "position_campaigns" INTEGER,

    CONSTRAINT "campaign_positions__position_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_topIssues__topissue_campaigns" (
    "id" SERIAL NOT NULL,
    "campaign_topIssues" INTEGER,
    "topissue_campaigns" INTEGER,

    CONSTRAINT "campaign_topIssues__topissue_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_voters__voter_campaigns" (
    "id" SERIAL NOT NULL,
    "campaign_voters" INTEGER,
    "voter_campaigns" INTEGER,

    CONSTRAINT "campaign_voters__voter_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaignclaim" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "user" INTEGER,
    "candidate" INTEGER,

    CONSTRAINT "campaignclaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaignplanversion" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "data" JSON,
    "campaign" INTEGER,

    CONSTRAINT "campaignplanversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaignupdatehistory" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "type" TEXT,
    "quantity" REAL,
    "user" INTEGER,
    "campaign" INTEGER,

    CONSTRAINT "campaignupdatehistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaignvolunteer" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "role" TEXT,
    "campaign" INTEGER,
    "user" INTEGER,

    CONSTRAINT "campaignvolunteer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN,
    "chamber" TEXT,
    "isOnHomepage" BOOLEAN,
    "state" TEXT,
    "data" TEXT,
    "contact" JSON,

    CONSTRAINT "candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_positions__position_candidates" (
    "id" SERIAL NOT NULL,
    "candidate_positions" INTEGER,
    "position_candidates" INTEGER,

    CONSTRAINT "candidate_positions__position_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_topIssues__topissue_candidates" (
    "id" SERIAL NOT NULL,
    "candidate_topIssues" INTEGER,
    "topissue_candidates" INTEGER,

    CONSTRAINT "candidate_topIssues__topissue_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidateissue" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "data" JSON,
    "status" TEXT,
    "candidate" INTEGER,

    CONSTRAINT "candidateissue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidateposition" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "description" TEXT,
    "order" REAL,
    "candidate" INTEGER,
    "campaign" INTEGER,
    "topIssue" INTEGER,
    "position" INTEGER,

    CONSTRAINT "candidateposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cmscontent" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "content" TEXT,

    CONSTRAINT "cmscontent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "key" TEXT,
    "subKey" TEXT,
    "data" JSON,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "county" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "name" TEXT,
    "state" TEXT,
    "data" JSON,

    CONSTRAINT "county_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doorknockingcampaign" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "data" JSON,
    "status" TEXT,
    "campaign" INTEGER,

    CONSTRAINT "doorknockingcampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doorknockingroute" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "data" JSON,
    "status" TEXT,
    "dkCampaign" INTEGER,
    "volunteer" INTEGER,

    CONSTRAINT "doorknockingroute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doorknockingvoter" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "geoHash" TEXT,
    "zip" TEXT,
    "isCalculated" BOOLEAN,
    "voter" INTEGER,
    "dkCampaign" INTEGER,

    CONSTRAINT "doorknockingvoter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "electiondeadlines" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "state" TEXT,
    "year" TEXT,
    "reportType" TEXT,
    "reportPeriod" TEXT,
    "relativeDueDate" TEXT,
    "dueDate" BIGINT,

    CONSTRAINT "electiondeadlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endorsement" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "summary" TEXT,
    "title" TEXT,
    "link" TEXT,
    "image" TEXT,
    "candidate" INTEGER,

    CONSTRAINT "endorsement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpfularticle" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "cmsId" TEXT,
    "uuid" TEXT,
    "isHelpful" BOOLEAN,
    "feedback" TEXT,

    CONSTRAINT "helpfularticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "helpfultopic" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "candidateId" TEXT,
    "uuid" TEXT,
    "topicId" TEXT,
    "isHelpful" BOOLEAN,
    "feedback" TEXT,

    CONSTRAINT "helpfultopic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "keyvalue" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "key" TEXT,
    "value" TEXT,

    CONSTRAINT "keyvalue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "l2count" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "electionType" TEXT,
    "electionLocation" TEXT,
    "electionDistrict" TEXT,
    "counts" JSON,

    CONSTRAINT "l2count_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipality" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "slug" TEXT,
    "name" TEXT,
    "type" TEXT,
    "state" TEXT,
    "data" JSON,
    "county" INTEGER,

    CONSTRAINT "municipality_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "isRead" BOOLEAN,
    "data" JSON,
    "user" INTEGER,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pathtovictory" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "data" JSON,
    "campaign" INTEGER,

    CONSTRAINT "pathtovictory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "position" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "topIssue" INTEGER,

    CONSTRAINT "position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "candidateId" REAL,
    "uuid" TEXT,
    "chamber" TEXT,
    "isIncumbent" BOOLEAN,

    CONSTRAINT "share_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sharecandidate" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "candidate" REAL,
    "user" INTEGER,

    CONSTRAINT "sharecandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "role" TEXT,
    "user" INTEGER,
    "createdBy" INTEGER,
    "candidate" INTEGER,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "data" JSON,
    "voter" INTEGER,
    "campaign" INTEGER,
    "dkCampaign" INTEGER,
    "route" INTEGER,
    "volunteer" INTEGER,

    CONSTRAINT "survey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topissue" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "icon" TEXT,

    CONSTRAINT "topissue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "name" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "socialId" TEXT,
    "socialProvider" TEXT,
    "zip" TEXT,
    "isPhoneVerified" BOOLEAN,
    "isEmailVerified" BOOLEAN,
    "avatar" TEXT,
    "password" TEXT,
    "hasPassword" BOOLEAN,
    "passwordResetToken" TEXT,
    "passwordResetTokenExpiresAt" REAL,
    "emailConfToken" TEXT,
    "emailConfTokenDateCreated" TEXT,
    "voteStatus" TEXT,
    "isAdmin" BOOLEAN,
    "metaData" TEXT,
    "displayName" TEXT,
    "referrer" INTEGER,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visit" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "url" TEXT,
    "data" TEXT,

    CONSTRAINT "visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "volunteerinvitation" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "campaign" INTEGER,

    CONSTRAINT "volunteerinvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voter" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "voterId" TEXT,
    "data" JSON,
    "address" TEXT,
    "party" TEXT,
    "state" TEXT,
    "city" TEXT,
    "zip" TEXT,
    "lat" TEXT,
    "lng" TEXT,
    "geoHash" TEXT,
    "pendingProcessing" BOOLEAN,

    CONSTRAINT "voter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votersearch" (
    "createdAt" BIGINT,
    "updatedAt" BIGINT,
    "id" SERIAL NOT NULL,
    "l2ColumnName" TEXT,
    "l2ColumnValue" TEXT,
    "voter" INTEGER,

    CONSTRAINT "votersearch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ballotelection_ballotId_key" ON "ballotelection"("ballotId");

-- CreateIndex
CREATE UNIQUE INDEX "ballotposition_ballotId_key" ON "ballotposition"("ballotId");

-- CreateIndex
CREATE UNIQUE INDEX "ballotrace_ballotId_key" ON "ballotrace"("ballotId");

-- CreateIndex
CREATE UNIQUE INDEX "ballotrace_hashId_key" ON "ballotrace"("hashId");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_slug_key" ON "campaign"("slug");

-- CreateIndex
CREATE INDEX "campaign_user" ON "campaign"("user");

-- CreateIndex
CREATE UNIQUE INDEX "candidate_slug_key" ON "candidate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "candidateissue_candidate_key" ON "candidateissue"("candidate");

-- CreateIndex
CREATE UNIQUE INDEX "county_slug_key" ON "county"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "doorknockingcampaign_slug_key" ON "doorknockingcampaign"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "keyvalue_key_key" ON "keyvalue"("key");

-- CreateIndex
CREATE UNIQUE INDEX "municipality_slug_key" ON "municipality"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "position_name_key" ON "position"("name");

-- CreateIndex
CREATE UNIQUE INDEX "topissue_name_key" ON "topissue"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "voter_voterId_key" ON "voter"("voterId");
