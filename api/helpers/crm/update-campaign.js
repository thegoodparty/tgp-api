// https://developers.hubspot.com/docs/api/crm/contacts
const hubspot = require('@hubspot/api-client');

const hubSpotToken =
  sails.config.custom.hubSpotToken || sails.config.hubSpotToken;

module.exports = {
  inputs: {
    campaign: {
      type: 'json',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    try {
      if (!hubSpotToken) {
        // for non production env.
        return exits.success('no api key');
      }

      const appBase = sails.config.custom.appBase || sails.config.appBase;
      if (appBase === 'http://localhost:4000') {
        console.log('crm helpers disabled on localhost');
        return exits.success('crm helpers disabled on localhost');
      }

      const hubspotClient = new hubspot.Client({ accessToken: hubSpotToken });

      const { campaign } = inputs;
      const { data, isActive } = campaign;
      let { lastStepDate, name } = data;
      const dataDetails = data?.details;
      const goals = data?.goals;
      const currentStep = data?.currentStep || '';
      const electionDate = goals?.electionDate || undefined;

      // console.log('dataDetails', dataDetails);
      // console.log('lastStepDate', lastStepDate);
      const { zip, party, office, state, pledged } = dataDetails;

      //UNIX formatted timestamps in milliseconds
      const electionDateMs = electionDate
        ? new Date(electionDate).getTime()
        : undefined;

      if (!name && dataDetails?.firstName && dataDetails?.lastName) {
        name = `${dataDetails?.firstName} ${dataDetails?.lastName}`;
      }
      if (!name) {
        // the name is on hte user (old records)
        const user = await User.findOne({ id: campaign.user });
        name = user.name;
        data.name = name;
      }

      const longState = state
        ? await sails.helpers.zip.shortToLongState(state)
        : undefined;
      const companyObj = {
        properties: {
          name,
          candidate_party: party,
          candidate_office: office,
          state: longState,
          lifecyclestage: 'customer',
          type: 'CAMPAIGN',
          last_step: currentStep,
          last_step_date: lastStepDate || undefined,
          zip,
          pledge_status: pledged ? 'yes' : 'no',
          is_active: !!name,
          live_candidate: isActive,
          // todo: this will need to be reworked if/when we add in Rob/Colton
          p2v_complete_date: data?.p2vCompleteDate || undefined,
          p2v_status: data?.p2vStatus || 'Locked',
          election_date: electionDateMs,
          doors_knocked: data?.reportedVoterGoals?.doorKnocking || 0,
          calls_made: data?.reportedVoterGoals?.calls || 0,
          online_impressions: data?.reportedVoterGoals?.digital || 0,
          my_content_pieces_created: data?.aiContent
            ? Object.keys(data.aiContent).length
            : 0,
        },
      };

      const existingId = data.hubspotId;
      if (existingId) {
        // console.log('updating existing company in hubspot', existingId);
        try {
          await hubspotClient.crm.companies.basicApi.update(
            existingId,
            companyObj,
          );
        } catch (e) {
          console.log('error updating crm', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error updating company for ${name} with existing hubspotId: ${existingId} in hubspot`,
            e,
          );
        }
        const userId = campaign.user;
        const user = await User.findOne({ id: userId });
        try {
          await sails.helpers.crm.updateUser(user);
        } catch (e) {
          console.log('error updating crm', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error updating user ${user.id} with existing hubspotId: ${existingId} in hubspot`,
            e,
          );
        }

        // console.log('apiResp', apiResp);
        return exits.success(existingId);
      } else {
        // update user record with the id from the crm
        // console.log('creating new company in hubspot');
        let createCompanyResponse;
        try {
          createCompanyResponse =
            await hubspotClient.crm.companies.basicApi.create(companyObj);
        } catch (e) {
          console.log('error creating company', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error creating company for ${name} in hubspot`,
            e,
          );
        }

        if (!createCompanyResponse) {
          await sails.helpers.slack.errorLoggerHelper(
            `Error creating company for ${name} in hubspot. No response from hubspot.`,
            { companyObj, campaign },
          );
          return exits.success('not ok');
        }

        const userId = campaign.user;
        // console.log('userId', userId);
        const user = await User.findOne({ id: userId });
        const hubspotId = createCompanyResponse.id;
        data.hubspotId = hubspotId;
        await Campaign.updateOne({ id: campaign.id }).set({
          data,
        });
        // make sure we refresh campaign object so we have hubspotId.
        const campaignObj = await Campaign.findOne({ id: campaign.id });

        // associate the Contact with the Company in Hubspot
        // console.log('associating user with company in hubspot');
        try {
          await sails.helpers.crm.associateUserCampaign(
            user,
            campaignObj,
            false,
          );
        } catch (e) {
          console.log('error updating crm', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error associating user ${user.id}. hubspot id: ${hubspotId} to campaign ${campaign.id} in hubspot`,
            e,
          );
        }
        // console.log('apiResp', apiResp);
        try {
          await sails.helpers.crm.updateUser(user);
        } catch (e) {
          console.log('error updating crm', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error updating user ${user.id}. in hubspot`,
            e,
          );
        }
        return exits.success(hubspotId);
      }
    } catch (e) {
      console.log('hubspot error - update-campaign', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Uncaught error in update-campaign',
        e,
      );
      return exits.success('not ok');
    }
  },
};
