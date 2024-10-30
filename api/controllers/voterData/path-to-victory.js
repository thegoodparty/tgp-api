module.exports = {
  inputs: {
    slug: {
      // this is only for admins. users can only run their own campaign
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'ok',
      responseType: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      await sails.helpers.queue.consumer();
      let campaign;
      const { slug } = inputs;
      const { user } = this.req;
      if (!user.isAdmin && slug) {
        await sails.helpers.slack.errorLoggerHelper(
          'Only admins can run campaigns by slug.',
          { slug, user: user.id },
        );
        return exits.badRequest({
          message: 'Only admins can run campaigns by slug.',
        });
      }

      if (user.isAdmin && slug) {
        campaign = await Campaign.findOne({ slug });
      } else {
        campaign = await sails.helpers.campaign.byUser(user.id);
      }

      let p2v = await PathToVictory.findOne({ campaign: campaign.id });

      if (!p2v) {
        p2v = await PathToVictory.create({
          campaign: campaign.id,
          data: { p2vStatus: 'Waiting' },
        }).fetch();

        await Campaign.updateOne({ id: campaign.id }).set({
          pathToVictory: p2v.id,
        });
      } else {
        await PathToVictory.updateOne({
          id: p2v.id,
        }).set({
          data: { ...p2v.data, p2vStatus: 'Waiting', p2vAttempts: 0 },
        });
      }

      await sails.helpers.queue.enqueuePathToVictory(campaign.id);

      return exits.success({
        message: 'ok',
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.slack.errorLoggerHelper('Error path-to-victory', e);

      return exits.badRequest({ message: 'Error path-to-victory.' });
    }
  },
};
