const { findSlug } = require('../../utils/campaign/findSlug');
const { createCrmUser } = require('../../utils/campaign/createCrmUser');

// const attr = [
//   { key: 'details.positionId', value: position?.id },
//   { key: 'details.electionId', value: election?.id },
//   { key: 'details.raceId', value: id },
//   { key: 'details.state', value: election?.state },
//   { key: 'details.office', value: 'Other' },
//   { key: 'details.otherOffice', value: position?.name },
//   {
//     key: 'details.officeTermLength',
//     value: calcTerm(position),
//   },
//   { key: 'details.ballotLevel', value: position?.level },
//   {
//     key: 'details.primaryElectionDate',
//     value: election?.primaryElectionDate,
//   },
//   {
//     key: 'details.electionDate',
//     value: election?.electionDay,
//   },
//   {
//     key: 'details.partisanType',
//     value: position?.partisanType,
//   },
//   {
//     key: 'details.primaryElectionId',
//     value: election?.primaryElectionId,
//   },
//   {
//     key: 'details.hasPrimary',
//     value: position?.hasPrimary,
//   },
//   {
//     key: 'details.filingPeriodsStart',
//     value:
//       filingPeriods && filingPeriods.length > 0
//         ? filingPeriods[0].startOn
//         : undefined,
//   },
//   {
//     key: 'details.filingPeriodsEnd',
//     value:
//       filingPeriods && filingPeriods.length > 0
//         ? filingPeriods[0].endOn
//         : undefined,
//   },
//   // reset the electionType and electionLocation
//   // so it can run a full p2v.
//   {
//     key: 'pathToVictory.electionType',
//     value: undefined,
//   },
//   {
//     key: 'pathToVictory.electionLocation',
//     value: undefined,
//   },
// ];

const DEMO_PERSONAS_DATA = {
  matthew: {
    name: 'Matthew McConaughey',
    zip: 49301,
    details: {
      // positionId:,
      // electionId:,
      // raceId:,
      // state:,
      // office:,
      // otherOffice: ,
      // officeTermLength:,
      // ballotLevel:,
      // primaryElectionDate:,
      // electionDate:,
      // partisanType:,
      // primaryElectionId:,
      // hasPrimary:,
      // filingPeriodsStart:,
      // filingPeriodsEnd:,
    },
  },
  taylor: {
    name: 'Taylor Swift',
    zip: 37122,
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
      const data = {
        slug,
        currentStep: 'onboarding-complete',
        launchStatus: 'launched',
        name: demoPersonaData.name,
      };

      const campaign = await Campaign.create({
        slug,
        data,
        isActive: true,
        isDemo: true,
        user: user.id,
        details: {
          zip: demoPersonaData.zip,
        },
      }).fetch();
      await createCrmUser(user.firstName, user.lastName, user.email);

      const p2v = await PathToVictory.create({
        campaign: campaign.id,
        data: { p2vStatus: 'Waiting' },
      }).fetch();

      await Campaign.updateOne({ id: campaign.id }).set({
        pathToVictory: p2v.id,
      });

      await sails.helpers.queue.enqueuePathToVictory(campaign.id);

      return exits.success({
        slug,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};
