const { findSlug } = require('../../utils/campaign/findSlug');
const { createCrmUser } = require('../../utils/campaign/createCrmUser');
const { dateToISO8601DateString } = require('../../utils/dates');
const {
  sendCampaignLaunchEmail,
} = require('../../utils/campaign/event-handlers/sendCampaignLaunchEmail');

const get8WeeksFutureDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7 * 8);
  return date;
};

const DEMO_PERSONAS_DATA = {
  matthew: {
    name: 'Matthew McConaughey',
    campaignDetails: {
      zip: 49301,
      positionId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb24vMTMyODM3',
      electionId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvRWxlY3Rpb24vNjAxMA==',
      raceId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb25FbGVjdGlvbi8yMDk5MDgy',
      state: 'TX',
      office: 'Other',
      otherOffice: 'Austin City Mayor',
      officeTermLength: '4 years',
      ballotLevel: 'CITY',
      partisanType: 'nonpartisan',
      hasPrimary: false,
      filingPeriodsStart: '2026-07-18',
      filingPeriodsEnd: '2026-08-17',
    },
    pathToVictoryData: {
      p2vStatus: 'Complete',
      electionLocation: 'TX##AUSTIN CITY (EST.)',
      electionType: 'City',
      totalRegisteredVoters: 563805,
      republicans: 91800,
      democrats: 363628,
      indies: 108377,
      averageTurnout: 299645,
      projectedTurnout: 298817,
      winNumber: 152397.0,
      voterContactGoal: 761985.0,
      p2vCompleteDate: '2024-08-01',
    },
  },
  taylor: {
    name: 'Taylor Swift',
    campaignDetails: {
      zip: 37122,
      positionId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb24vNDYyMjk=',
      electionId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvRWxlY3Rpb24vNDcyMw==',
      raceId: 'Z2lkOi8vYmFsbG90LWZhY3RvcnkvUG9zaXRpb25FbGVjdGlvbi8xNTIwNTY4',
      state: 'TN',
      office: 'Other',
      otherOffice: 'U.S. Senate - Tennessee',
      officeTermLength: '6 years',
      ballotLevel: 'FEDERAL',
      partisanType: 'partisan',
      hasPrimary: true,
      filingPeriodsStart: '2024-06-17',
      filingPeriodsEnd: '2024-08-15',
    },
    pathToVictoryData: {
      p2vStatus: 'Complete',
      totalRegisteredVoters: 4249323,
      republicans: 1492766,
      democrats: 803080,
      indies: 1953477,
      averageTurnout: 1618418,
      projectedTurnout: 1652219,
      winNumber: '826275.00',
      voterContactGoal: '4131375.00',
      electionType: '',
      electionLocation: '',
      p2vCompleteDate: '2024-07-19',
    },
  },
};

module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'Campaign Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'creation failed',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { user } = this.req;
      const { demoPersona } = JSON.parse(user.metaData || '{}');
      const demoPersonaData = DEMO_PERSONAS_DATA[demoPersona];
      const userName = await sails.helpers.user.name(user);
      if (userName === '') {
        return exits.badRequest('No user name');
      }

      const slug = await findSlug(demoPersonaData.name);

      const campaign = await Campaign.create({
        slug,
        data: {
          slug,
          currentStep: 'onboarding-complete',
          launchStatus: 'launched',
          name: demoPersonaData.name,
        },
        isActive: true,
        isDemo: true,
        user: user.id,
        details: {
          pledged: true,
          party: 'Independent',
          electionDate: dateToISO8601DateString(get8WeeksFutureDate()),
          ...demoPersonaData.campaignDetails,
        },
      }).fetch();
      await createCrmUser(user.firstName, user.lastName, user.email);

      const p2v = await PathToVictory.create({
        campaign: campaign.id,
        data: demoPersonaData.pathToVictoryData,
      }).fetch();

      await Campaign.updateOne({ id: campaign.id }).set({
        pathToVictory: p2v.id,
      });

      await sails.helpers.campaign.linkCandidateCampaign(campaign.id);

      await sails.helpers.crm.updateCampaign(campaign);
      await sails.helpers.fullstory.customAttr(campaign.id);

      await sendCampaignLaunchEmail(slug);

      return exits.success({
        slug,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};
