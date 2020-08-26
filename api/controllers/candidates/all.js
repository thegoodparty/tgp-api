module.exports = {
  friendlyName: 'All Candidates',

  description: 'directory call for getting all candidates',

  inputs: {},

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error getting candidates',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const presidential = await PresidentialCandidate.find({
        isActive: true,
      }).sort([{ isIncumbent: 'DESC' }, { combinedRaised: 'DESC' }]);

      const senateIncumbents = await Incumbent.find({
        isHidden: false,
        isActive: true,
        chamber: 'Senate',
      }).sort([{ raised: 'DESC' }]);
      const senateCands = await RaceCandidate.find({
        isHidden: false,
        isActive: true,
        chamber: 'Senate',
      }).sort([{ raised: 'DESC' }]);

      const houseIncumbents = await Incumbent.find({
        isHidden: false,
        isActive: true,
        chamber: 'House',
      }).sort([{ raised: 'DESC' }]);

      const houseCands = await RaceCandidate.find({
        isHidden: false,
        isActive: true,
        chamber: 'House',
      }).sort([{ raised: 'DESC' }]);

      senateIncumbents.forEach(incumbent => (incumbent.isIncumbent = true));
      houseIncumbents.forEach(incumbent => (incumbent.isIncumbent = true));

      return exits.success({
        presidential,
        senateIncumbents,
        senateCands,
        houseIncumbents,
        houseCands,
      });
    } catch (e) {
      console.log(e);
      await sails.helpers.errorLoggerHelper('Error at candidates/all', e);
      return exits.badRequest({
        message: 'Error getting candidates',
      });
    }
  },
};
