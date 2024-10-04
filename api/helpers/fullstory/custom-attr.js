const axios = require('axios');
const moment = require('moment');
const { patchUserMetaData } = require('../../utils/user/patchUserMetaData');
const { fetchFsUserId } = require('../../utils/tracking/fetchFsUserId');
const { reconcileFsUserId } = require('../../utils/tracking/reconcileFsUserId');
const {
  mapCampaignManagementRequests,
} = require('../../utils/tracking/mapCampaignManagementRequests');

const fullStoryKey =
  sails.config.custom.fullStoryKey || sails.config.fullStoryKey;

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    userId: {
      type: 'number',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },
  },
  fn: async function (inputs, exits) {
    try {
      if (!fullStoryKey) {
        // for non production env.
        return exits.success('no api key');
      }

      if (appBase === 'http://localhost:4000') {
        console.log('fullstory helpers disabled on localhost');
        return exits.success('fullstory helpers disabled on localhost');
      }

      const { userId } = inputs;
      const user = await User.findOne({ id: userId });

      if (!user) {
        return exits.success('no user found');
      }

      const campaign = await sails.helpers.campaign.byUser(userId);

      const { firstName, lastName } = user;
      const { email } = user;
      const emailDomain = email.split('@')[1];
      if (emailDomain === 'goodparty.org') {
        return exits.success('Skipping fullstory for goodparty.org users');
      }

      const headers = {
        Authorization: `Basic ${fullStoryKey}`,
        'Content-Type': 'application/json',
      };

      const {
        id: campaignId,
        slug,
        data,
        details,
        isVerified,
        isPro,
        aiContent,
        isActive,
      } = campaign || {};

      const campaignManagementRequests =
        !campaign &&
        // We have to do this because Full Story doesn't support arrays as
        //  property values 🤦‍♂️
        mapCampaignManagementRequests(
          (await CampaignManagementRequest.find({
            user: userId,
            role: 'manager',
          })) || [],
        );

      const campaignVolunteer =
        campaign &&
        (await CampaignVolunteer.findOne({
          campaign: campaignId,
          user: userId,
          role: 'manager',
        }));
      // TODO: This will break once a user is managing multiple campaigns.
      //  Make it work for that edge case when it comes up.
      const managingCampaign = campaignVolunteer ? campaignId : false;

      let fsUserId = await reconcileFsUserId(campaign, user);

      let aiContentKeys = [];
      if (aiContent) {
        aiContentKeys = Object.keys(aiContent);
      }

      const { currentStep, reportedVoterGoals, hubSpotUpdates } = data || {};
      const {
        electionDate,
        primaryElectionDate,
        ballotLevel,
        state,
        pledged,
        party,
        filingPeriodsStart,
        filingPeriodsEnd,
      } = details || {};

      const { doorKnocking, calls, digital } = reportedVoterGoals || {};

      const electionDateMonth = electionDate
        ? moment(electionDate).format('MMMYY')
        : '';
      const primaryElectionDateMonth = primaryElectionDate
        ? moment(primaryElectionDate).format('MMMYY')
        : '';

      const filingPeriodsStartMonth = filingPeriodsStart
        ? moment(filingPeriodsStart).format('MMMYY')
        : '';
      const filingPeriodsEndMonth = filingPeriodsEnd
        ? moment(filingPeriodsEnd).format('MMMYY')
        : '';

      const p2vStatus = campaign?.pathToVictory?.data?.p2vStatus || 'n/a';

      if (!fsUserId) {
        // First, check if the user exists in FullStory
        fsUserId = await fetchFsUserId(headers, user);
        await patchUserMetaData(user, { fsUserId });
      }

      console.log('fsUserId', fsUserId);
      if (fsUserId) {
        // Update the user with custom properties
        const properties = {
          slug,
          isActive,
          electionDate, // Date as a string
          primaryElectionDate,
          level: ballotLevel ? ballotLevel.toLowerCase() : undefined,
          state,
          pledged,
          party,
          currentStep,
          isVerified,
          isPro,
          aiContentCount: aiContent ? Object.keys(aiContent).length : 0,
          p2vStatus,
          electionDateStr: electionDateMonth,
          primaryElectionDateStr: primaryElectionDateMonth,
          filingPeriodsStartMonth,
          filingPeriodsEndMonth,
          doorKnocked: doorKnocking || 0,
          callsMade: calls || 0,
          onlineImpressions: digital || 0,
          ...(hubSpotUpdates || {}),
          managingCampaign,
          ...(campaignManagementRequests || {}),
        };
        for (let i = 0; i < aiContentKeys.length; i++) {
          properties[`ai-content-${aiContentKeys[i]}`] = true;
        }
        await axios.post(
          `https://api.fullstory.com/v2/users/${fsUserId}`,
          {
            properties,
          },
          {
            headers,
          },
        );

        return exits.success('updated user');
      } else {
        console.error('no fsUserId');
        await sails.helpers.slack.errorLoggerHelper(
          'FullStory error - no FS user ID found or created',
          {
            slug: campaign.slug,
            email,
            firstName,
            lastName,
          },
        );
      }
      return exits.success('no user found');
    } catch (e) {
      console.log('FullStory error - custom-attr', e);
      await sails.helpers.slack.errorLoggerHelper(
        'FullStory error - custom-attr',
        e,
      );
      return exits.success('not ok');
    }
  },
};

// example of result for the uid=1234 call
const r = {
  results: [
    {
      id: '7449164135934483470',
      uid: '9853',
      display_name: ' ',
      email: 'triplegee575@gmail.com',
      is_being_deleted: false,
      properties: null,
      schema: null,
      type_conflicts: null,
      app_url:
        'https://app.fullstory.com/ui/TBEDP/segments/everyone/people:search:AGWKmfDGXMOe/user/7449164135934483470?url_source=api',
    },
  ],
  total_records: '1',
  next_page_token: null,
  app_url:
    'https://app.fullstory.com/ui/TBEDP/segments/everyone/people:search:AGWKmfDGXMOe/0?url_source=api',
};
