module.exports = {
  inputs: {},

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
      const user = this.req.user;
      const campaigns = await CampaignVolunteer.find({
        user: user.id,
      }).populate('campaign');

      if (!campaigns || campaigns.length === 0) {
        return exits.success({
          campaigns: false,
        });
      }
      let cleanCampaigns = [];
      campaigns.forEach((campaign) => {
        console.log('campaign', campaign);
        const { firstName, lastName, slug } = campaign.campaign.data;
        const { city, state, office, otherOffice, party, district } =
          campaign.campaign.data.details;
        cleanCampaigns.push({
          firstName,
          lastName,
          city,
          state,
          office,
          otherOffice,
          party,
          district,
          slug,
        });
      });

      return exits.success({
        campaigns: cleanCampaigns,
      });
    } catch (e) {
      console.log('Error finding campaigns', e);
      return exits.badRequest({ message: 'Error finding campaigns.' });
    }
  },
};
