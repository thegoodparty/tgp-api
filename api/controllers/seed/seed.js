module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    let count = 0;
    try {
      // migrate pledged candidates with old onboarding to active candidate
      const pledged = await Campaign.find({ isActive: false }).populate('user');
      for (let i = 0; i < pledged.length; i++) {
        const campaign = pledged[i];
        const { data } = campaign;
        const { details } = data || {};
        if (details?.pledged) {
          await Campaign.updateOne({ id: campaign.id }).set({
            isActive: true,
            data: {
              ...data,
              launchStatus: 'launched',
              currentStep: 'onboarding-complete',
            },
          });
          await sendMail(campaign);
          count++;
        }
      }
      return exits.success({
        message: `updated ${count} campaigns`,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};

async function sendMail(campaign) {
  try {
    const { user } = campaign;
    const variables = JSON.stringify({
      name: `${user.name}`,
      link: `${appBase}/dashboard/plan`,
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
