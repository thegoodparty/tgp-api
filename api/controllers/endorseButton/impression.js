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
      console.log('id', id);
      const outputFile = path.join(
        __dirname,
        `../../../tempImages/pixel.png`,
      );

      this.res.sendFile(outputFile, {
        headers: { 'Content-Type': 'image/png' },
      });

      // return exits.success({
      //   message: 'created',
      // });
    } catch (e) {
      console.log('Error creating campaign updates', e);
      return exits.badRequest({ message: 'Error registering visit' });
    }
  },
};
