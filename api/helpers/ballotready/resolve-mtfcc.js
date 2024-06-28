module.exports = {
  inputs: {
    mtfcc: {
      type: 'string',
    },
    geoId: {
      type: 'string',
    },
  },
  exits: {
    success: {
      description: 'ok',
    },
    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    const { mtfcc, geoId } = inputs;
    let geoData;
    // geoId is a string that an start with 0, so we need remove that 0
    geoId = geoId ? parseInt(geoId, 10).toString() : undefined;
    if (mtfcc && geoId) {
      const census = await CensusEntity.findOne({ mtfcc, geoId });
      if (census) {
        geoData = {
          name: census.name,
          type: census.mtfccType,
        };
        // todo: this can be improved for county recognition
        // and other types of entities (school board, etc)
        if (census.mtfccType !== 'State or Equivalent Feature') {
          geoData.city = census.name;
        }
      }
    }
    return exits.success(geoData);
  },
};
