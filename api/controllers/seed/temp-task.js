module.exports = {
  friendlyName: 'Seed',

  description: 'seed role',

  inputs: {},

  exits: {
    success: {
      description: 'AllCandidates',
    },

    badRequest: {
      description: 'Error seeding database',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const candidates = await Candidate.find();
      for (let i = 0; i < candidates.length; i++) {
        const { data } = candidates[i];
        if (data) {
          let parsed = JSON.parse(data);
          const { image } = parsed;
          if (image) {
            const newImage = image.replace(
              'https://assets.thegoodparty.org',
              'https://assets.goodparty.org',
            );
            console.log('image', image);
            console.log('newImage', newImage);

            parsed.image = newImage;
            const newData = JSON.stringify(parsed);
            await Candidate.updateOne({ id: candidates[i].id }).set({
              data: newData,
            });
          }
        }
      }
      return exits.success({});
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error in temp task',
      });
    }
  },
};
