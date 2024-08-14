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
      const userMetadata = JSON.parse(user.metaData || '{}');
      const { demoPersona } = userMetadata;
      if (!demoPersona) {
        return exits.badRequest('Not a demo campaign user');
      }
      await User.updateOne({ id: user.id }).set({
        metaData: JSON.stringify({
          ...userMetadata,
          accountType: null,
          demoPersona: null,
          whyBrowsing: null,
        }),
      });
      const campaign = await Campaign.findOne({ user: user.id });
      const { pathToVictory: p2vId } = campaign;
      await PathToVictory.destroyOne({ id: p2vId });
      await CandidatePosition.destroy({
        campaign: campaign.id,
      });
      await Campaign.destroyOne({ id: campaign.id });

      return exits.success({
        message: 'Demo campaign deleted.',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error creating campaign.' });
    }
  },
};
