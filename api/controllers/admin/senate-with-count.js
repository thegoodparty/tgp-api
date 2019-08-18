module.exports = {
  friendlyName: 'Senate with Count',

  description: 'Senate with user count',

  inputs: {},

  fn: async function(inputs, exits) {
    try {
      const senate = [];
      let userCount;
      const senats = await SenateDistrict.find();

      // can't use map or forEach because of the await
      for (let i = 0; i < senats.length; i++) {
        userCount = await User.count({ senateDistrict: senats[i].id });
        senate.push({
          ...senats[i],
          userCount,
        });
      }

      return exits.success({
        senate,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting Senate',
      });
    }
  },
};
