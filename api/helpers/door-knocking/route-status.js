module.exports = {
  inputs: {
    route: {
      type: 'json',
      required: true,
    },
    calculateTotals: {
      type: 'boolean',
    },
  },

  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { route, calculateTotals } = inputs;
      if (
        !route ||
        !route.data ||
        !route.data.optimizedAddresses ||
        !route.volunteer
      ) {
        return exits.success({ route });
      }
      const addresses = route.data.optimizedAddresses;
      let completeCount = 0;
      const totals = {
        completed: 0,
        skipped: 0,
        refusal: 0,
        likelyVoters: 0,
        positiveExperience: 0,
      };
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        const surveys = await Survey.find({
          voter: address.voterId,
          route: route.id,
          volunteer:
            typeof route.volunteer === 'number'
              ? route.volunteer
              : route.volunteer?.id,
        });
        const survey = surveys.length > 0 ? surveys[0] : null;
        if (survey) {
          const { data } = survey;
          if (!data) {
            continue;
          }
          if (
            data.resolution === '5 - Enthusiastic Supporter' ||
            data.resolution === '4 - Somewhat Interested'
          ) {
            totals.positiveExperience++;
          }
          if (
            data.voteLikelihood === 'Likely' ||
            data.voteLikelihood === 'Strong yes'
          ) {
            totals.likelyVoters++;
          }

          if (
            data.resolution === '1 - Not Interested' ||
            data.resolution === '2 - Skeptical'
          ) {
            totals.refusal++;
          }

          if (data?.status === 'completed') {
            completeCount++;
            address.status = 'completed';
            totals.completed++;
          } else if (data?.status === 'skipped') {
            completeCount++;
            totals.skipped++;
            address.status = 'skipped';
          } else {
            totals.inProgress++;
            address.status = 'in-progress';
          }
        }
      }
      if (completeCount === addresses.length) {
        await DoorKnockingRoute.updateOne({ id: route.id }).set({
          status: 'completed',
        });
        route.status = 'completed';
      }
      if (calculateTotals) {
        route.data.totals = totals;
      }
      return exits.success({ route });
    } catch (err) {
      console.log('error at helpers/door-knocking/route-status', err);

      return exits.success({ route: inputs.route });
    }
  },
};
