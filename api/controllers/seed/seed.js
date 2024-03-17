module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    let count = 0;
    let errors = [];
    try {
      const voters = await Voter.find().limit(1000);
      for (let i = 0; i < voters.length; i++) {
        const address = `${voters[i].address} ${voters[i].city}, ${voters[i].state} ${voters[i].zip}`;
        const loc = await sails.helpers.geocoding.geocodeAddress(address);
        const { lat, lng, full, geoHash } = loc;
        await Voter.updateOne({ id: voters[i].id }).set({
          lat,
          lng,
          data: { ...voters[i].data, geoLocation: full },
          geoHash,
        });
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
