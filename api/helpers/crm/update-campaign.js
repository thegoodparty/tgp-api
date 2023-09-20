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
      const hubspotClient = new hubspot.Client({ accessToken: hubSpotToken });

      const { campaign } = inputs;
      // console.log('campaign', campaign);
      const { data } = campaign;
      const { launchStatus, lastStepDate } = data;
      const dataDetails = campaign?.data?.details;
      const goals = campaign?.data?.goals;
      const currentStep = campaign?.data?.currentStep || '';
      const electionDate = goals?.electionDate || undefined;

      const profileCompleted =
        data?.profile &&
        (data.profile.completed || data.profilecampaignWebsite);
      // console.log('dataDetails', dataDetails);
      // console.log('lastStepDate', lastStepDate);
      const { zip, firstName, lastName, party, office, state, pledged } =
        dataDetails;

      const longState = state
        ? await sails.helpers.zip.shortToLongState(state)
        : undefined;
      const companyObj = {
        properties: {
          name: `${firstName} ${lastName}`,
          candidate_name: `${firstName} ${lastName}`,
          candidate_party: party,
          candidate_office: office,
          state: longState,
          lifecyclestage: 'customer',
          type: 'CANDIDATE',
          last_step: currentStep,
          last_step_date: lastStepDate || undefined,
          zip,
          pledge_status: pledged ? 'yes' : 'no',
          is_active: !!firstName,
          live_candidate: launchStatus === 'launched',
          // todo: this will need to be reworked if/when we add in Rob/Colton
          unlock_expert: profileCompleted ? 'Jared' : '',
          unlock_jared: profileCompleted ? 'Yes' : 'No',
          p2v_complete_date: data?.p2vCompleteDate || undefined,
          p2v_status: data?.p2vStatus || 'Locked',
          election_date: electionDate || undefined,
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
          await sails.helpers.errorLoggerHelper(
            `Error updating company for ${firstName} ${lastName} with existing hubspotId: ${existingId} in hubspot`,
            e,
          );
        }
        const userId = campaign.user;
        const user = await User.findOne({ id: userId });
        try {
          await sails.helpers.crm.updateUser(user);
        } catch (e) {
          console.log('error updating crm', e);
          await sails.helpers.errorLoggerHelper(
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
          await sails.helpers.errorLoggerHelper(
            `Error creating company for ${firstName} ${lastName} in hubspot`,
            e,
          );
        }

        if (!createCompanyResponse) {
          await sails.helpers.errorLoggerHelper(
            `Error creating company for ${firstName} ${lastName} in hubspot. No response from hubspot.`,
            companyObj,
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
          await sails.helpers.errorLoggerHelper(
            `Error associating user ${user.id}. hubspot id: ${hubspotId} to campaign ${campaign.id} in hubspot`,
            e,
          );
        }
        // console.log('apiResp', apiResp);
        try {
          await sails.helpers.crm.updateUser(user);
        } catch (e) {
          console.log('error updating crm', e);
          await sails.helpers.errorLoggerHelper(
            `Error updating user ${user.id}. in hubspot`,
            e,
          );
        }
        return exits.success(hubspotId);
      }
    } catch (e) {
      console.log('hubspot error - update-campaign', e);
      await sails.helpers.errorLoggerHelper(
        'Uncaught error in update-campaign',
        e,
      );
      return exits.success('not ok');
    }
  },
};
