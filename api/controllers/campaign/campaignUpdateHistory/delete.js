module.exports = {
  friendlyName: 'delete Update History',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Deleted',
    },

    badRequest: {
      description: 'Error updating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id } = inputs;

      const existing = await CampaignUpdateHistory.findOne({
        id,
        user: this.req.user.id,
      }).populate('campaign');
      if (!existing) {
        return exits.badRequest({
          message: 'Campaign Update History not found',
        });
      }
      console.log('existing', existing);

      const { campaign } = existing;
      const data = campaign.data;
      const { reportedVoterGoals } = data;
      if (reportedVoterGoals) {
        let { doorKnocking, calls, digital } = reportedVoterGoals;
        if (existing.type === 'doorKnocking') {
          doorKnocking -= existing.quantity;
        }
        if (existing.type === 'calls') {
          calls -= existing.quantity;
        }
        if (existing.type === 'digital') {
          digital -= existing.quantity;
        }
        data.reportedVoterGoals = { doorKnocking, calls, digital };
        await Campaign.updateOne({ id: campaign.id }).set({ data });
        await CampaignUpdateHistory.destroyOne({ id });
      }

      return exits.success({
        message: 'deleted',
      });
    } catch (e) {
      console.log('error at campaignUpdateHistory/delete', e);
      return exits.badRequest({
        message: 'Error deleting Campaign UpdateHistory',
        e,
      });
    }
  },
};
