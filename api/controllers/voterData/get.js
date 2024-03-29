// create campaignVolunteer via accepting VolunteerInvitation
module.exports = {
  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    dkSlug: {
      type: 'string',
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
      const { id, dkSlug } = inputs;

      const campaignVolunteers = await CampaignVolunteer.find({
        user: user.id,
      });
      const voter = await Voter.findOne({ id }).populate('campaigns');

      if (!campaignVolunteers.length === 0 || !voter) {
        console.log('no campaignVolunteers or voter');
        return exits.badRequest('You do not have access to this voter.');
      }

      // no one likes nested loops, but most users will have one volunteer
      let campaign = false;
      for (let i = 0; i < campaignVolunteers.length; i++) {
        for (let j = 0; j < voter.campaigns.length; j++) {
          if (campaignVolunteers[i].campaign === voter.campaigns[j].id) {
            campaign = voter.campaigns[j];
            break;
          }
        }
      }
      if (!campaign) {
        return exits.badRequest('You do not have access to this voter.');
      }
      const dkCampaign = await DoorKnockingCampaign.findOne({
        slug: dkSlug,
        campaign: campaign.id,
      });

      if (!dkCampaign) {
        return exits.badRequest('You do not have access to this campaign.');
      }

      const { data } = campaign;
      const { details, customIssues } = data;
      const { office, otherOffice, electionDate } = details;

      voter.campaign = {
        firstName: details.firstName || data.firstName,
        lastName: details.lastName || data.lastName,
        office: office === 'Other' ? otherOffice : office,
        electionDate,
        customIssues,
      };
      delete voter.campaigns;

      voter.dkCampaign = dkCampaign.data;

      const positions = await CandidatePosition.find({
        campaign: campaign.id,
      })
        .populate('position')
        .populate('topIssue');

      const cleanPositions = positions.map((position) => {
        return {
          order: position.order,
          title: position.description,
          position: position.position.name,
          topIssue: position.topIssue.name,
        };
      });

      voter.campaign.positions = cleanPositions;

      return exits.success({
        voter,
      });
    } catch (e) {
      console.log('Error at voterData/get', e);
      return exits.badRequest({ message: 'Error getting voter' });
    }
  },
};
