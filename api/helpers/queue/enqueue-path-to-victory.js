module.exports = {
  inputs: {
    campaign: {
      type: 'json',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    try {
      // TODO: add this back when we go to production.
      // if (appBase !== 'https://goodparty.org') {
      //   return;
      // }
      const { campaign } = inputs;
      const { details, goals } = campaign;
      const { office, state, city, district, officeTermLength } = details;
      const { electionDate } = goals;

      // TODO: we don't currently store the election level in the campaign details
      // we need to add it to the campaign details
      // we currently guess by seeing if city is filled out.
      // we also need to add electionCounty to the campaign details

      let termLength = 0;
      // extract the number from the officeTermLength string
      if (officeTermLength) {
        termLength = officeTermLength.match(/\d+/)[0];
      }

      const queueMessage = {
        type: 'pathToVictory',
        data: {
          officeName: office,
          electionDate: electionDate,
          electionTerm: termLength,
          electionLevel: city ? 'city' : 'state',
          electionState: state,
          electionCounty: '',
          electionMunicipality: city,
          subAreaName: district ? 'district' : undefined,
          subAreaValue: district,
        },
      };
      await sails.helpers.queue.enqueue(queueMessage);
    } catch (e) {
      console.log('error at enqueue', e);
      return exits.success({ message: 'not ok', e });
    }
  },
};
