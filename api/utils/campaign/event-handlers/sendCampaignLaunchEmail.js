async function sendCampaignLaunchEmail(slug) {
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

module.exports = {
  sendCampaignLaunchEmail,
};
