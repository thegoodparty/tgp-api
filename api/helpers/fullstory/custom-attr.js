const axios = require('axios');
const moment = require('moment');

const fullStoryKey =
  sails.config.custom.fullStoryKey || sails.config.fullStoryKey;

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    campaignId: {
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

      const { campaignId } = inputs;
      const campaign = await Campaign.findOne({ id: campaignId })
        .populate('user')
        .populate('pathToVictory');
      const { user } = campaign;
      if (!user) {
        return exits.success('no user found');
      }
      const { firstName, lastName } = user;
      const { email, id } = user;
      const domain = email.split('@')[1];
      if (domain === 'goodparty.org') {
        return exits.success('Skipping fullstory for goodparty.org users');
      }

      const headers = {
        Authorization: `Basic ${fullStoryKey}`,
        'Content-Type': 'application/json',
      };
      let fsUserId;

      const { data, details, isVerified, isPro, aiContent } = campaign || {};

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
      if (data.fsUserId) {
        fsUserId = data.fsUserId;
      } else {
        // First, check if the user exists in FullStory
        try {
          const response = await axios.get(
            `https://api.fullstory.com/v2/users?uid=${id}`,
            {
              headers,
            },
          );
          if (response?.data?.results?.length === 1) {
            fsUserId = response.data.results[0].id;
          } else {
            return exits.success('no user found');
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // User does not exist, create them
            const createResponse = await axios.post(
              'https://api.fullstory.com/v2/users',
              {
                uid: id,
                displayName: `${firstName} ${lastName}`, // Customize this as needed
              },
              {
                headers,
              },
            );
            fsUserId = createResponse.data.id;
          } else {
            throw error;
          }
        }

        await Campaign.updateOne({ id: campaignId }).set({
          data: { ...data, fsUserId },
        });
      }
      console.log('fsUserId', fsUserId);
      if (fsUserId) {
        // Update the user with custom properties
        await axios.post(
          `https://api.fullstory.com/v2/users/${fsUserId}`,
          {
            properties: {
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
            },
          },
          {
            headers,
          },
        );

        return exits.success('updated user');
      } else {
        console.log('no fsUserId');
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
