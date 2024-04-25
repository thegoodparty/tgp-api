// Admin endpoint

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  friendlyName: 'Admin launch Campaign',

  inputs: {},

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    forbidden: {
      description: 'Unauthorized',
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { user } = this.req;

      let campaignRecord = await sails.helpers.campaign.byUser(user);

      if (!campaignRecord) {
        return exits.forbidden();
      }

      const campaignData = campaignRecord.data;

      if (campaignRecord.isActive || campaignData.launchStatus === 'launched') {
        return exits.success({ message: 'already launched' });
      }

      const updated = await Campaign.updateOne({ id: campaignRecord.id }).set({
        isActive: true,
        data: {
          ...campaignData,
          launchStatus: 'launched',
          currentStep: 'onboarding-complete',
        },
      });

      await sails.helpers.crm.updateCampaign(updated);

      await sendMail(campaignRecord.slug);

      return exits.success({
        message: 'created',
        slug: campaignRecord.slug,
      });
    } catch (e) {
      console.log('Error at campaign launch', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at campaign launch',
        e,
      );
      return exits.forbidden();
    }
  },
};

//campagin-launch

async function sendMail(slug) {
  try {
    const campaign = await Campaign.findOne({ slug }).populate('user');
    const { user } = campaign;
    const name = await sails.helpers.user.name(user);
    const variables = JSON.stringify({
      name,
      link: `${appBase}/dashboard`,
    });
    await sails.helpers.mailgun.mailgunTemplateSender(
      user.email,
      'Full Suite of AI Campaign Tools Now Available',
      'campagin-launch',
      variables,
    );
  } catch (e) {
    console.log(e);
  }
}
