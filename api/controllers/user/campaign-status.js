module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'Campaign Created.',
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
      const { metaData } = user;
      const now = new Date();
      const timestamp = now.getTime();
      let updatedMeta = metaData ? JSON.parse(metaData) : {};
      updatedMeta = {
        ...updatedMeta,
        lastVisited: timestamp,
      };

      await User.updateOne({ id: user.id }).set({
        metaData: JSON.stringify(updatedMeta),
      });

      const campaign = await sails.helpers.campaign.byUser(user.id);
      if (!campaign) {
        // check if the user is a volunteer
        const volunteer = await CampaignVolunteer.findOne({ user: user.id });
        if (volunteer) {
          return exits.success({
            status: 'volunteer',
            // profile: volunteer.campaign,
          });
        }
        let step = 'account-type';
        if (updatedMeta.accountType === 'browsing') {
          step = 'browsing';
        }
        return exits.success({
          status: false,
          step,
        });
      }

      const { data, details } = campaign;

      await Campaign.updateOne({ slug: campaign.slug }).set({
        data: { ...data, lastVisited: timestamp },
      });
      if (campaign.isActive) {
        return exits.success({
          status: 'candidate',
          profile: campaign.slug,
          // pathToVictory: campaign.pathToVictory ? 'Complete' : 'Waiting',
        });
      }
      let step = 1;
      if (details?.office) {
        step = 2;
      }
      if (details?.party || details?.otherParty) {
        step = 3;
      }
      if (details?.pledged) {
        step = 4;
      }

      return exits.success({
        status: 'onboarding',
        slug: data.slug,
        step,
      });
    } catch (e) {
      console.log('error at campaign status', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error getting campaign status',
        e,
      );
      return exits.badRequest({ message: 'Error getting campaign status' });
    }
  },
};
