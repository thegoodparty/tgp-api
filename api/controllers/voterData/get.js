// create campaignVolunteer via accepting VolunteerInvitation
module.exports = {
  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;
      const { id } = inputs;
      console.log('in voterdata/get', id, user.id);

      const campaignVolunteers = await CampaignVolunteer.find({
        user: user.id,
      });
      console.log('campaignVolunteers.length', campaignVolunteers.length);
      const voter = await Voter.findOne({ id }).populate('campaigns');

      if (!campaignVolunteers.length === 0 || !voter) {
        console.log('no campaignVolunteers or voter');
        return exits.badRequest('You do not have access to this voter.');
      }

      // no one likes nested loops, but most user will have one volunteer
      let campaign = false;
      for (let i = 0; i < campaignVolunteers.length; i++) {
        for (let j = 0; j < voter.campaigns.length; j++) {
          console.log(
            `in loop i: ${i} j: ${j}.  `,
            campaignVolunteers[i].campaign,
            voter.campaigns[j].id,
          );
          if (campaignVolunteers[i].campaign === voter.campaigns[j].id) {
            campaign = voter.campaigns[j];
            break;
          }
        }
      }
      console.log('campaign', campaign);
      if (!campaign) {
        console.log('no campaign');
        return exits.badRequest('You do not have access to this voter.');
      }

      voter.campaign = campaign;
      delete voter.campaigns;

      const positions = await CandidatePosition.find({
        campaign: campaign.id,
      })
        .populate('position')
        .populate('topIssue');

      console.log('positions', positions);

      const cleanPositions = positions.map((position) => {
        return {
          order: position.order,
          title: position.description,
          position: position.position.name,
          topIssue: position.topIssue.name,
        };
      });

      voter.campaign.positions = cleanPositions;

      console.log('final voter', voter);

      return exits.success({
        voter,
      });
    } catch (e) {
      console.log('Error at voterData/get', e);
      return exits.badRequest({ message: 'Error getting voter' });
    }
  },
};
