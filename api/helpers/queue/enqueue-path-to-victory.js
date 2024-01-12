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
      const { data } = campaign;
      const { details, goals } = data;
      const { office, state, city, district, officeTermLength } = details;
      const { electionDate } = goals;

      // TODO: we don't currently store the election level in the campaign details
      // we need to add it to the campaign details
      // we currently guess by seeing if city is filled out.
      // we also need to add electionCounty to the campaign details
      // for now we do some basic guessing for electionLevel;
      let electionLevel = 'city';
      if (
        office.toLowerCase().includes('senate') ||
        office.toLowerCase().includes('house')
      ) {
        electionLevel = 'state';
      } else if (office.toLowerCase().includes('county')) {
        electionLevel = 'county';
      } else if (
        office.toLowerCase().includes('congress') ||
        office.toLowerCase().includes('president')
      ) {
        electionLevel = 'federal';
      }

      let termLength = 0;
      // extract the number from the officeTermLength string
      if (officeTermLength) {
        termLength = officeTermLength.match(/\d+/)[0];
      }

      const queueMessage = {
        type: 'pathToVictory',
        data: {
          campaignId: campaign.id,
          officeName: office,
          electionDate: electionDate,
          electionTerm: termLength,
          electionLevel: electionLevel,
          electionState: state,
          electionCounty: '',
          electionMunicipality: city,
          subAreaName: district ? 'district' : undefined,
          subAreaValue: district,
        },
      };

      console.log('queueMessage', queueMessage);
      await sails.helpers.queue.enqueue(queueMessage);
      return exits.success({ message: 'ok' });
    } catch (e) {
      console.log('error at enqueue', e);
      return exits.success({ message: 'not ok', e });
    }
  },
};
