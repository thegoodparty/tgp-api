const { stat } = require('fs');

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      const campaigns = await Campaign.find({ isActive: true });
      let csvRows = `campaignId,campaignSlug,candidateName,positionId,electionId,raceId,electionDate,state,otherOffice<br/>`;
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        const positionId = campaign.data?.details?.positionId;
        if (positionId) {
          const position = await BallotPosition.findOne({
            ballotId: positionId,
          });
          if (position?.data?.hasPrimary) {
            csvRows += `${campaign?.id},${campaign?.slug},${campaign.data?.firstName} ${campaign.data?.lastName},${position?.id},${campaign?.data?.details?.electionId},${campaign?.data?.details?.raceId},${campaign?.data?.details?.electionDate},${campaign?.data?.details?.state},${campaign?.data?.details?.otherOffice}<br/>`;
          }
        }
      }

      return exits.success(csvRows);
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
