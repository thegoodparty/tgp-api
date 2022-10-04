// https://developers.hubspot.com/docs/api/crm/contacts

const maineCandidates = {
  '04039': 'Anne Gass',
  '04071': 'Anne Gass',
  '04240': 'Benjamin Weisner',
  '04259': 'Kent Ackley',
  '04260': 'Anne Gass',
  '04265': 'Kent Ackley',
  '04280': 'Kent Ackley',
  '04284': 'Kent Ackley',
  '04348': 'Les Fossel',
  '04350': 'Kent Ackley',
  '04354': 'Lindsey Harwath',
  '04358': 'Lindsey Harwath',
  '04535': 'Les Fossel',
  '04578': 'Les Fossel',
  '04626': 'Melissa Hinerman',
  '04628': 'Melissa Hinerman',
  '04630': 'Melissa Hinerman',
  '04652': 'Melissa Hinerman',
  '04654': 'Melissa Hinerman',
  '04655': 'Melissa Hinerman',
  '04657': 'Melissa Hinerman',
  '04666': 'Melissa Hinerman',
  '04668': 'Melissa Hinerman',
  '04686': 'Melissa Hinerman',
  '04691': 'Melissa Hinerman',
  '04694': 'Melissa Hinerman',
  '04810': 'Benjamin Weisner',
  '04901': 'Lindsey Harwath',
  '04915': 'Betsy Garrold',
  '04921': 'Betsy Garrold',
  '04951': 'Betsy Garrold',
  '04986': 'Betsy Garrold',
  '04998': 'Betsy Garrold',
  '04353': 'Les Fossel',
  '04438': 'Betsy Garrold',
};
module.exports = {
  inputs: {
    user: {
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
  fn: async function(inputs, exits) {
    try {
      const { user } = inputs;
      const { zip } = user;

      let candidateName = maineCandidates[zip];
      if (!candidateName) {
        return exits.success('not found');
      }
      candidateName = candidateName.split(' ');
      if (candidateName.length !== 2) {
        return exits.success('not found');
      }
      const firstName = candidateName[0];
      const lastName = candidateName[1];

      const candidate = await Candidate.find({ firstName, lastName });
      if (!candidateName) {
        return exits.success('could not find candidate in db');
      }
      await sails.helpers.crm.associateUserCandidate(user, candidate);

      return exits.success('ok');
    } catch (e) {
      console.log('error in match-main-candidates helper', e);
      return exits.success('ok');
    }
  },
};
