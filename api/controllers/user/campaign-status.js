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

      const campaignRequests = await CampaignRequest.find({
        user: user.id,
      });

      if (campaignRequests?.length) {
        return exits.success({
          status: false,
          step: '',
          campaignRequestPending: true,
        });
      }

      const campaign = await sails.helpers.campaign.byUser(user.id);
      const volunteer = await CampaignVolunteer.findOne({ user: user.id });
      if (!campaign) {
        if (volunteer) {
          return exits.success({
            status: 'volunteer',
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

      const { data, details, slug, role } = campaign;

      await Campaign.updateOne({ slug }).set({
        data: { ...data, lastVisited: timestamp },
      });

      if (role === 'manager') {
        return exits.success({
          status: 'manager',
          profile: slug,
          user: await User.findOne({ id: user.id }),
        });
      }

      if (campaign.isActive) {
        return exits.success({
          status: 'candidate',
          profile: slug,
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
