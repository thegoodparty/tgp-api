
module.exports = {
  inputs: {
    candidate: {
      type: 'ref',
    },
  },

  fn: async function(inputs, exits) {
    try {
      const { candidate } = inputs;
      const candidateData = JSON.parse(candidate.data);

      const name = `${candidateData.firstName} ${candidateData.lastName}`;
      const brand = await SocialBrand.findOne({ name });


      // return exits.success(results);
    } catch (e) {
      console.log(
        'error at helpers/socialListening/new-candidate-helper',
        e,
      );
      return exits.success([]);
    }
  },
};

