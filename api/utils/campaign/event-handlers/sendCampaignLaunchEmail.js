const appBase = sails.config.custom.appBase || sails.config.appBase;

async function sendCampaignLaunchEmail(slug) {
  try {
    const campaign = await Campaign.findOne({ slug }).populate('user');
    const { user } = campaign;
    const name = await sails.helpers.user.name(user);
    const variables = {
      name,
      link: `${appBase}/dashboard`,
    };
    await sails.helpers.mailgun.mailgunTemplateSender(
      user.email,
      'Full Suite of AI Campaign Tools Now Available',
      'campaign-launch', // misspelled in Mailgun as well. Don't fix.
      variables,
    );
  } catch (e) {
    console.log(e);
  }
}

module.exports = {
  sendCampaignLaunchEmail,
};
