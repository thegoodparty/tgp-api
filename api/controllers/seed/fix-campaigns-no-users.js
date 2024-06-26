module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      let counter = 0;
      const campaigns = await Campaign.find({ user: null });
      const slugHash = {};
      campaigns.forEach((campaign) => {
        slugHash[campaign.slug] = campaign.id;
      });

      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        try {
          // try to infer the user from the campaign slug. we will only handle firstName-lastName slugs.
          const slugParts = campaign.slug.split('-');
          if (slugParts.length === 2) {
            const firstName = slugParts[0];
            const lastName = slugParts[1];
            // make the first letter of the first and last name uppercase
            const firstNameCapitalized =
              firstName.charAt(0).toUpperCase() + firstName.slice(1);
            const lastNameCapitalized =
              lastName.charAt(0).toUpperCase() + lastName.slice(1);
            const user = await User.find({
              firstName: firstNameCapitalized,
              lastName: lastNameCapitalized,
            });
            if (user && user.length === 1) {
              // make sure the user is not already assigned to a campaign
              const userCampaign = await Campaign.find({ user: user[0].id });
              if (userCampaign && userCampaign.length === 0) {
                await Campaign.updateOne({ id: campaign.id }).set({
                  user: user[0].id,
                });
                counter++;
              }
            }
          }
        } catch (e) {
          console.log('Error in fix campaign no users', e);
          await sails.helpers.slack.errorLoggerHelper(
            `Error at fix campaign no users ${campaign.slug}`,
            e,
          );
        }
      }
      await sails.helpers.slack.errorLoggerHelper(
        `updated ${counter} campaigns`,
        {},
      );
      return exits.success(`updated ${counter} campaigns`);
    } catch (e) {
      console.log('Error at fix campaign no users', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at fix campaign no users',
        e,
      );
      return exits.success({
        message: 'Error in fix campaign no users',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};

/*
aiContnet strycture
socialMediaCopy: {
      name: 'Social Media Copy',
      updatedAt: '2023-08-29',
      content: '<p>create a social pos</p>',
    },
  */

/*
campaignPlan structure
    messageBox:
      '<div class="grid grid-cols-2 gap-4">\n\n  <div class="bg-green-300 p-4">\n    <h1 class="font-bold text-lg mb-4">What I will say about myself</h1>\n    <ul>\n      <li>I\'m Tomer Almog, an independent candidate running for the US Senate.</li>\n      <li>I have years of experience on the local school board, where I worked to improve the quality of education.</li>\n      <li>I\'m a CTO of Good Party and my passion is music, which has helped me develop creativity, perseverance, and a willingness to take risks.</li>\n      <li>I care deeply about funding public schools, stopping book bans, and defending the 2nd amendment.</li>\n    </ul>\n  </div>\n\n  <div class="bg-red-300 p-4">\n    <h1 class="font-bold text-lg mb-4">What I will say about my opponent</h1>\n    <ul>\n      <li>My opponent, John Smith, is a corrupt politician.</li>\n      <li>He\'s from the Democrat Party and is beholden to special interests and big money donors.</li>\n      <li>He\'ll say and do anything to win, regardless of the ethical implications.</li>\n      <li>He has a long history of supporting policies that harm constituents and put profits over people.</li>\n    </ul>\n  </div>\n\n  <div class="bg-blue-300 p-4">\n    <h1 class="font-bold text-lg mb-4">What my opponent will say about me</h1>\n    <ul>\n      <li>Tomer Almog is a fringe candidate with no real place in the political landscape.</li>\n      <li>He\'s too inexperienced and has no real grasp on how to get things done in Congress.</li>\n      <li>His policies are unrealistic and would never be able to pass in a divided government.</li>\n      <li>He\'s too focused on music and other extracurricular activities to take the job of US Senator seriously.</li>\n    </ul>\n  </div>\n\n  <div class="bg-yellow-300 p-4">\n    <h1 class="font-bold text-lg mb-4">What my opponent will say about themselves</h1>\n    <ul>\n      <li>John Smith is the only candidate with the experience and know-how to get things done in Congress.</li>\n      <li>He\'s committed to fighting for the people, not special interests or big money donors.</li>\n      <li>His policies are realistic and will bring about the changes that constituents need most.</li>\n      <li>He has a proven track record of success and has always put the needs of his constituents first.</li>\n    </ul>\n  </div>\n\n</div>',

      */
