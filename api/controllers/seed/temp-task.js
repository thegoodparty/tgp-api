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
      console.log('temp-task1');
      const candidates = await Candidate.find();
      console.log('temp-task2');
      for (let i = 0; i < candidates.length; i++) {
        console.log('temp-task3 lpop candidates[i]', candidates[i]);
        const { data } = candidates[i];
        console.log('temp-task4', data);
        if (data) {
          let parsed = JSON.parse(data);
          console.log('temp-task5');
          const { image } = parsed;
          console.log('temp-task6', image);
          if (image) {
            console.log('temp-task7');
            const newImage = image.replace(
              'https://assets.thegoodparty.org',
              'https://assets.goodparty.org',
            );
            console.log('image', image);
            console.log('newImage', newImage);

            parsed.image = newImage;
            console.log('temp-task8');
            const newData = JSON.stringify(parsed);
            console.log('temp-task9');
            await Candidate.updateOne({ id: candidates[i].id }).set({
              data: newData,
            });
          }
        }
      }
      console.log('temp-task10');
      return exits.success({ message: 'seeded' });
    } catch (e) {
      console.log(e);
      return exits.badRequest({
        message: 'Error in temp task',
      });
    }
  },
};
