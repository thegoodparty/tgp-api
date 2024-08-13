// get election dates by position id.

module.exports = {
  inputs: {
    // can be candidate slug or campaign slug.
    slug: {
      type: 'string',
      required: true,
    },
    positionId: {
      type: 'string', // should be the hashId of the position
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { slug, positionId } = inputs;

      let position;
      try {
        position = await BallotPosition.findOne({
          ballotId: positionId.toString(),
        });
      } catch (e) {
        console.log('error getting position', e);
      }

      let electionDates = [];
      if (
        position &&
        position?.electionDates &&
        position.electionDates.length > 0
      ) {
        for (const electionDateObj of position.electionDates) {
          if (
            electionDateObj?.electionDay &&
            electionDateObj?.isPrimary === false &&
            electionDateObj?.isRunoff === false
          ) {
            electionDates.push(electionDateObj.electionDay);
          }
        }
      }

      sails.helpers.log(slug, 'electionDates', electionDates);

      return exits.success(electionDates);
    } catch (e) {
      console.log('error at get-election-dates-position helper', e);
      return exits.success(false);
    }
  },
};
