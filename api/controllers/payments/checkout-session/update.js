const {
  getFormattedDateString,
  formatUSDateString,
  convertISO8601DateStringToUSDateString,
} = require('../../../utils/dates');
const stripe = require('stripe')(
  sails.config.custom.stripeSecretKey || sails.config.stripeSecretKey,
);

const sendProConfirmationEmail = async (user, campaign) => {
  const { details: campaignDetails } = campaign;
  const { electionDate: ISO8601DateString } = campaignDetails;

  const formattedCurrentDate = getFormattedDateString(new Date());
  const electionDate =
    ISO8601DateString &&
    formatUSDateString(
      convertISO8601DateStringToUSDateString(ISO8601DateString),
    );

  const emailVars = {
    userFullName: await sails.helpers.user.name(user),
    startDate: formattedCurrentDate,
    ...(electionDate ? { electionDate } : {}),
  };

  try {
    await sails.helpers.mailgun.mailgunTemplateSender(
      user.email,
      `Welcome to Pro! Let's Empower Your Campaign Together`,
      'pro-confirmation',
      JSON.stringify(emailVars),
    );
  } catch (e) {
    await sails.helpers.slack.errorLoggerHelper(
      'Error sending pro confirmation email',
      e,
    );
  }
};

module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'Successfully updated checkout session',
    },

    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const checkoutSessionId = this.req.param('sessionId');

    if (!checkoutSessionId) {
      return exits.badRequest('sessionId is required');
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(
      checkoutSessionId,
    );

    if (!checkoutSession?.customer) {
      throw new Error('No customer ID found on checkout session');
    }

    const user = await User.findOne({ id: this.req.user.id });

    const metaData = JSON.parse(user.metaData);
    metaData.customerId = checkoutSession.customer;

    await User.updateOne({
      id: user.id,
    }).set({
      metaData: JSON.stringify(metaData),
    });

    const campaign = await sails.helpers.campaign.byUser(user);

    // TODO: This REALLY should be sent on receiving the relevant webhook event from the payment processor
    //  Only placing here because we don't have anywhere better to put it right now
    await sendProConfirmationEmail(user, campaign);

    return exits.success();
  },
};
