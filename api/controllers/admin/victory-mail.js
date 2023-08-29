const appBase = sails.config.custom.appBase || sails.config.appBase;
const moment = require('moment');

module.exports = {
  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Email sent',
      responseType: 'ok',
    },
    badRequest: {
      description: 'email Failed',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { slug } = inputs;
      const campaign = await Campaign.findOne({ slug }).populate('user');
      const { user } = campaign;
      const variables = JSON.stringify({
        name: `${user.name}`,
        link: `${appBase}/onboarding/${slug}/campaign-plan`,
      });
      await sails.helpers.mailgun.mailgunTemplateSender(
        user.email,
        'Exciting News: Your Customized Campaign Plan is Updated!',
        'candidate-victory-ready',
        variables,
        'jared@goodparty.org',
      );

      await Campaign.updateOne({ slug }).set({
        data: {
          ...campaign.data,
          p2vCompleteDate: moment().format('YYYY-MM-DD'),
          p2vStatus: 'Complete',
        },
      });

      return exits.success({
        message: 'sent',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error registering candidate.' });
    }
  },
};
