module.exports = {
  inputs: {
    route: {
      type: 'json',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { route } = inputs;
      if (
        !route ||
        !route.data ||
        !route.data.optimizedAddresses ||
        !route.volunteer
      ) {
        console.log('error - cannot find add status to route');
        return exits.success(route);
      }
      const addresses = route.data.optimizedAddresses;
      let completeCount = 0;
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i];
        const survey = await Survey.findOne({
          voter: address.voterId,
          route: route.id,
          volunteer: route.volunteer.id,
        });
        if (survey) {
          if (survey.data?.status === 'completed') {
            completeCount++;
            address.status = 'completed';
          } else if (survey.data?.status === 'skipped') {
            completeCount++;
            address.status = 'skipped';
          } else {
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
      return exits.success(route);
    } catch (err) {
      console.log('error at helpers/door-knocking/route-status', err);

      return exits.success(inputs.route);
    }
  },
};
