const getRaceDetails = require('../../../utils/campaign/getRaceDetails');
const handlePathToVictory = require('../../../utils/campaign/handlePathToVictory');

// Test a path to victory for a campaign without saving the result.
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

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    try {
      let { campaignId } = inputs;
      // get a fresh copy of the campaign
      const campaign = await Campaign.findOne({ id: campaignId });

      const { slug, details } = campaign;

      let queueMessage = {
        type: 'pathToVictory',
        data: {
          campaignId,
        },
      };

      if (details?.raceId) {
        let raceId = details.raceId;

        sails.helpers.log(
          slug,
          `getting race details campaignId ${campaignId} raceId ${raceId} zip ${details.zip}`,
        );
        const data = await getRaceDetails(raceId, slug, details.zip);
        if (!data) {
          await sails.helpers.slack.slackHelper(
            { title: 'Error', body: `Failed to get race data for ${slug}` },
            'victory-issues',
          );
          return exits.success({ message: 'not ok' });
        }
        sails.helpers.log(slug, 'race data', data);
        queueMessage.data = { campaignId, ...data };
      }
      console.log('queueMessage', queueMessage);

      const result = await handlePathToVictory({ ...queueMessage.data });
      console.log('result', result);
      return exits.success({ result });
    } catch (e) {
      console.log('error at ai/test/path-to-victory', e);
      await sails.helpers.slack.errorLoggerHelper(
        'error at ai/test/path-to-victory',
        e,
      );
      return exits.success({ message: 'not ok', e });
    }
  },
};
