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
      const currentStep = campaign?.data?.currentStep || '';

      // console.log('dataDetails', dataDetails);
      // console.log('lastStepDate', lastStepDate);
      const { zip, firstName, lastName, party, office, state, pledged, goals } =
        dataDetails;
      const longState = await sails.helpers.zip.shortToLongState(state);
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
          is_active: launchStatus === 'launched',
          live_candidate: launchStatus === 'launched',
          // todo: this will need to be reworked if/when we add in Rob/Colton
          unlock_expert: data?.profile && data.profile.completed ? 'Jared' : '',
          unlock_jared: data?.profile && data.profile.completed ? 'Yes' : 'No',
          p2v_complete_date: data?.p2vCompleteDate || undefined,
          p2v_status: data?.p2vStatus || 'Locked',
        },
      };

      const existingId = data.hubspotId;
      if (existingId) {
        // console.log('updating existing company in hubspot', existingId);
        await hubspotClient.crm.companies.basicApi.update(
          existingId,
          companyObj,
        );

        const userId = campaign.user;
        const user = await User.findOne({ id: userId });
        await sails.helpers.crm.updateUser(user);

        // console.log('apiResp', apiResp);
        return exits.success(existingId);
      } else {
        // update user record with the id from the crm
        // console.log('creating new company in hubspot');
        const createCompanyResponse =
          await hubspotClient.crm.companies.basicApi.create(companyObj);

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
          await sails.helpers.errorLoggerHelper('Error updating hubspot', e);
        }
        // console.log('apiResp', apiResp);
        await sails.helpers.crm.updateUser(user);
        return exits.success(hubspotId);
      }
    } catch (e) {
      console.log('hubspot error - update-campaign', e);
      await sails.helpers.errorLoggerHelper(
        'Error updating hubspot- update-campaign',
        e,
      );
      return exits.success('not ok');
    }
  },
};
