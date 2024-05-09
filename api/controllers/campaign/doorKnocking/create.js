const slugify = require('slugify');

module.exports = {
  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    type: {
      type: 'string',
      required: true,
    },

    startDate: {
      type: 'string',
      required: true,
    },
    endDate: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { name, type, startDate, endDate } = inputs;
      // await sails.helpers.queue.consumer();

      const maxHousesPerRoute = 20;

      const user = this.req.user;
      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      if (campaign.data.hasVoterFile !== 'completed') {
        return exits.badRequest('No voter file');
      }

      const randomString = generateRandomString(5);

      const slug = `${campaign.slug}-${slugify(startDate, {
        lower: true,
      })}-${slugify(randomString, { lower: true })}`;
      const dkCampaign = await DoorKnockingCampaign.create({
        slug,
        data: {
          name,
          type,
          maxHousesPerRoute,
          startDate,
          endDate,
          slug,
        },
        campaign: campaign.id,
      }).fetch();

      const queueMessage = {
        type: 'calculateDkRoutes',
        data: {
          campaignId: campaign.id,
          dkCampaignId: dkCampaign.id,
          maxHousesPerRoute,
        },
      };
      await copyVoters(campaign.id, dkCampaign.id);
      await sails.helpers.slack.errorLoggerHelper(
        'enqueueing Calculating routes ',
        {
          queueMessage,
        },
      );

      await sails.helpers.queue.enqueue(queueMessage);

      // Create a volunteer for the user if they don't already have one
      await CampaignVolunteer.findOrCreate(
        {
          user: user.id,
          campaign: campaign.id,
        },
        {
          user: user.id,
          campaign: campaign.id,
          role: 'candidate',
        },
      );

      return exits.success({
        slug,
      });
    } catch (e) {
      console.log('Error at doorKnocking/create', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at doorKnocking/create ',
        e,
      );
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};

function generateRandomString(length) {
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

async function copyVoters(campaignId, dkCampaignId) {
  const campaign = await Campaign.findOne({ id: campaignId }).populate(
    'voters',
  );
  const voters = campaign.voters;
  const currentTimestamp = new Date().valueOf();

  let records = voters.map((voter) => [
    currentTimestamp,
    currentTimestamp,
    voter.geoHash,
    false,
    voter.id,
    dkCampaignId,
  ]);

  // Creating a bulk insert SQL statement
  let placeholders = records
    .map(
      (_, index) =>
        `($${6 * index + 1}, $${6 * index + 2}, $${6 * index + 3}, $${
          6 * index + 4
        }, $${6 * index + 5}, $${6 * index + 6})`,
    )
    .join(', ');
  let sql = `INSERT INTO public.doorknockingvoter ("createdAt", "updatedAt", "geoHash", "isCalculated", voter, "dkCampaign") VALUES ${placeholders}`;

  // Flattening the array of records for the SQL query
  let data = records.flat();

  try {
    const result = await sails.getDatastore().sendNativeQuery(sql, data);
    console.log('Inserted successfully:', result.rowCount);
  } catch (err) {
    console.error('Failed to insert:', err);
    throw err;
  }
}
