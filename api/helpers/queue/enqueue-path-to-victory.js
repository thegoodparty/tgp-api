const getRaceDetails = require('../../utils/campaign/get-race-details');

// Enqueue a message to the queue to process the path to victory for a campaign.
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
            `Failed to get race data for ${slug}`,
            'victory-issues',
            true,
          );
          return exits.success({ message: 'not ok' });
        }
        sails.helpers.log(slug, 'race data', data);
        queueMessage.data = { campaignId, ...data };

        // update the Campaign details
        if (details.details) {
          await Campaign.updateOne({ id: campaign.id }).set({
            details: {
              ...details.details,
              officeTermLength:
                data?.termLength ?? details.details.officeTermLength,
              electionDate: data?.electionDate ?? details.details.electionDate,
              level: data?.electionLevel ?? details.details.level,
              state: data?.electionState ?? details.details.state,
              county: data?.county ?? details.details.county,
              city: data?.city ?? details.details.city,
              district: data?.subAreaValue ?? details.details.district,
              partisanType: data?.partisanType ?? details.details.partisanType,
              priorElectionDates:
                data?.priorElectionDates ?? details.details.priorElectionDates,
            },
          });
        }
      } else {
        const user = await User.findOne({ id: campaign.user });
        sails.helpers.log(
          slug,
          'campaign does not have race_id. skipping p2v...',
        );
        if (user) {
          let runForOffice = campaign?.data?.details?.runForOffice || 'no';
          let knowRun = campaign?.data?.details?.knowRun || 'false';
          // only send slack message if user is running for office
          // and user did not pick an office.
          if (
            (runForOffice && runForOffice === 'yes') ||
            (knowRun && knowRun === 'true')
          ) {
            await sendVictoryIssuesSlackMessage(campaign, user);
          }
        }
        return exits.success({ message: 'ok' });
      }

      console.log('queueMessage', queueMessage);

      sails.helpers.log(slug, 'queueing Message', queueMessage);
      await sails.helpers.queue.enqueue(queueMessage);
      return exits.success({ message: 'ok' });
    } catch (e) {
      console.log('error at enqueue', e);
      await sails.helpers.slack.errorLoggerHelper('error at enqueue p2v', e);
      return exits.success({ message: 'not ok', e });
    }
  },
};

async function sendVictoryIssuesSlackMessage(campaign, user) {
  const { slug, details } = campaign;
  const { office, state, city, district } = details;
  const appBase = sails.config.custom.appBase || sails.config.appBase;

  const resolvedName = user?.firstName
    ? `${user.firstName} ${user.lastName}`
    : user?.name || '/n/a';

  const slackMessage = {
    text: `Onboarding Alert!`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `__________________________________ \n *Candidate did not select a standard position. * \n ${appBase}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*We need to manually add their admin Path to victory*\n
          \nName: ${resolvedName}
          \nOffice: ${office}
          \nState: ${state}
          \nCity: ${city || 'n/a'}
          \nDistrict: ${district || 'n/a'}
          \nemail: ${user.email}
          \nslug: ${slug}\n
          \nadmin link: ${appBase}/admin/victory-path/${slug}
          `,
        },
      },
    ],
  };

  await sails.helpers.slack.slackHelper(slackMessage, 'victory-issues', false);
}
