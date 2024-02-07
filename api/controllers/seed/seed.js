module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      // migrate pledged candidates with old onboarding to active candidate
      const pledged = await Campaign.find({ isActive: false });
      for (let i = 0; i < pledged.length; i++) {
        const campaign = pledged[i];
        const { data } = campaign;
        const { details } = data || {};
        if (details?.pledged) {
          await Campaign.updateOne({ id: campaign.id }).set({
            isActive: true,
            data: {
              ...data,
              launchStatus: 'launched',
              currentStep: 'onboarding-complete',
            },
          });
        }
      }
      return exits.success({
        message: 'ok',
      });
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
