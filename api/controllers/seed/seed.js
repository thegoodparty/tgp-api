const moment = require('moment');

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      const campaigns = await Campaign.find({ dataCopy: { '=': null } });

      for (let i = 0; i < campaigns.length; i++) {
        try {
          const campaign = campaigns[i];
          const { data } = campaign;
          if (!data) {
            continue;
          }
          // first backup the data
          await Campaign.updateOne({ id: campaign.id }).set({
            dataCopy: data,
          });

          const {
            details,
            campaignPlan,
            campaignPlanStatus,
            aiContent,
            goals,
            pathToVictory,
            p2vCompleteDate,
            p2vNotNeeded,
            p2vStatus,
          } = data;
          const updatedDetails = {
            ...details,
            ...goals,
          };
          if (data.customIssues) {
            updatedDetails.customIssues = data.customIssues;
          }
          const updatedPathToVictory = {
            ...pathToVictory,
          };
          if (p2vCompleteDate) {
            updatedPathToVictory.p2Complete = p2vCompleteDate;
          }
          if (p2vNotNeeded) {
            updatedPathToVictory.p2NotNeeded = p2vNotNeeded;
          }
          if (p2vStatus) {
            updatedPathToVictory.p2Status = p2vStatus;
          }
          delete data.customIssues;
          delete data.firstName;
          delete data.lastName;
          delete data.name;
          delete data.candidateSlug;
          delete data.p2vCompleteDate;
          delete data.p2vNotNeeded;
          delete data.p2vStatus;

          const p2v = await PathToVictory.findOrCreate(
            {
              campaign: campaign.id,
            },
            {
              data: updatedPathToVictory,
              campaign: campaign.id,
            },
          );

          const newAiContent = {
            ...aiContent,
            generationStatus: campaignPlanStatus,
          };

          // aiContent has a different structure than campaignPlan
          if (campaignPlan) {
            for (const key in campaignPlan) {
              if (campaignPlan[key]) {
                newAiContent[key] = {
                  content: campaignPlan[key],
                };
              }
            }
          }

          await Campaign.updateOne({ id: campaign.id }).set({
            details: updatedDetails,
            aiContent: newAiContent,
            data,
            pathToVictory: p2v.id,
          });
        } catch (e) {
          console.log('Error in seed', e);
          await sails.helpers.slack.errorLoggerHelper(
            'Error at seed',
            e,
            campaigns[i],
          );
        }
      }

      return exits.success(`updated ${campaigns.length} campaigns`);
    } catch (e) {
      console.log('Error in seed', e);
      await sails.helpers.slack.errorLoggerHelper('Error at seed', e);
      return exits.success({
        message: 'Error in seed',
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
