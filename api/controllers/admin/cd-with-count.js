module.exports = {
  friendlyName: 'CD with Count',

  description: 'Congressional Districts with user count',

  inputs: {},

  fn: async function(inputs, exits) {
    try {
      const cd = [];
      let userCount;
      const cds = await CongDistrict.find().populate('state');

      // can't use map or forEach because of the await
      for (let i = 0; i < cds.length; i++) {
        userCount = await User.count({ congDistrict: cds[i].id });
        cd.push({
          ...cds[i],
          userCount,
        });
      }

      return exits.success({
        cd,
      });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error getting Districts',
      });
    }
  },
};
