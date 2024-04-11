const { stat } = require('fs');

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      const campaigns = await Campaign.find({ isActive: true });
      let csvRows =
        'campaignId,positionId,electionId,raceId,electionDate,state,otherOffice\n';
      for (let i = 0; i < campaigns.length; i++) {
        const campaign = campaigns[i];
        const positionId = campaign.data?.details?.positionId;
        if (positionId) {
          const position = await BallotPosition.findOne({
            ballotId: positionId,
          });
          console.log('position', position?.data?.hasPrimary);
          if (position?.data?.hasPrimary) {
            csvRows += `${campaign.id},${position.id},${campaign?.data?.details?.electionId},${campaign?.data?.details?.raceId},${campaign?.data?.details?.electionDate},${campaign?.data?.details?.state},${campaign?.data?.details?.otherOffice}\n`;
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
