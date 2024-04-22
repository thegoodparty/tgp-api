const moment = require('moment');

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      const campaigns = await Campaign.find();

      for (let i = 0; i < campaigns.length; i++) {
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

        await Campaign.updateOne({ id: campaign.id }).set({
          details: updatedDetails,
          campaignPlan,
          campaignPlanStatus,
          aiContent,
          data,
          pathToVictory: p2v.id,
        });
      }

      return exits.success(`updated ${campaigns.length} campaigns`);
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
