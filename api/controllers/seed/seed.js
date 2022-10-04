/**
 * incumbents/find.js
 *
 * @description :: Find all Presidential Candidates.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      let count = 0;
      console.log('ma kore');
      const users = await User.find();
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const { zip, id } = user;
        try {
          if (zip) {
            const isMaine = await sails.helpers.zip.isMaineZip(zip);
            if (isMaine) {
              await sails.helpers.zip.followAllStateCandidates('ME', id);
            }
            await sails.helpers.zip.matchMaineCandidates(user);
            count++;
          }
        } catch (e) {
          console.log('error on user ', user);
          console.log(e);
        }
      }

      return exits.success({
        message: `Updated ${count} users`,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        error: JSON.stringify(e),
      });
    }
  },
};
