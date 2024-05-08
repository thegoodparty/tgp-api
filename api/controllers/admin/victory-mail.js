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
      const campaign = await Campaign.findOne({ slug })
        .populate('user')
        .populate('pathToVictory');

      if (!campaign.PathToVictory) {
        return exits.badRequest({ message: 'Path to Victory is not set.' });
      }
      const { user } = campaign;
      const name = await sails.helpers.user.name(user);
      const variables = JSON.stringify({
        name,
        link: `${appBase}/dashboard`,
      });

      await PathToVictory.updateOne({ id: campaign.pathToVictory.id }).set({
        data: {
          ...campaign.pathToVictory.data,
          p2vCompleteDate: moment().format('YYYY-MM-DD'),
          p2vStatus: 'Complete',
          completedBy: req.user.id,
        },
      });

      await sails.helpers.mailgun.mailgunTemplateSender(
        user.email,
        'Exciting News: Your Customized Campaign Plan is Updated!',
        'candidate-victory-ready',
        variables,
        'jared@goodparty.org',
      );

      return exits.success({
        message: 'sent',
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({ message: 'Error registering candidate.' });
    }
  },
};
