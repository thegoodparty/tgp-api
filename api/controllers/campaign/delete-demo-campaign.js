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

      const campaign = await sails.helpers.campaign.byUser(user.id);
      const { pathToVictory } = campaign;
      await PathToVictory.destroyOne({ id: pathToVictory?.id });
      await CandidatePosition.destroy({
        campaign: campaign.id,
      });
      await Campaign.destroyOne({ id: campaign.id });
      await User.updateOne({ id: user.id }).set({
        avatar: '',
        metaData: JSON.stringify({
          ...userMetadata,
          accountType: null,
          demoPersona: null,
          whyBrowsing: null,
        }),
      });

      return exits.success({
        message: 'Demo campaign deleted.',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error deleteing demo campaign.' });
    }
  },
};
