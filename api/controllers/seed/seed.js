const slugify = require('slugify');

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    let count = 0;
    let errors = [];
    try {
      const races = await BallotRace.find({
        where: {
          or: [{ positionSlug: null }, { positionSlug: '' }],
        },
      }).limit(10000);
      for (const race of races) {
        try {
          if (
            !race.normalizedPositionName ||
            race.normalizedPositionName === ''
          ) {
            const { data } = race;
            if (data.normalized_position_name) {
              await BallotRace.updateOne({ id: race.id }).set({
                positionSlug: slugify(data.normalized_position_name, {
                  lower: true,
                }),
              });
            }
            count++;
          }
        } catch (e) {
          console.log('Error in seed', e);
          errors.push(e);
        }
      }
      return exits.success({
        message: `updated ${count} races`,
        errors,
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
