const fs = require('fs');
const path = require('path');

module.exports = {
  friendlyName: 'Track Visit',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Created',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
  },
  async fn(inputs, exits) {
    try {
      const { id } = inputs;
      const outputFile = path.join(__dirname, `../../../tempImages/pixel.png`);

      await ButtonImpression.create({
        candidate: id,
        type: 'impression',
      });

      this.res.sendFile(outputFile, {
        headers: { 'Content-Type': 'image/png' },
      });
    } catch (e) {
      console.log('Error creating button impression', e);
      return exits.badRequest({ message: 'Error registering visit' });
    }
  },
};