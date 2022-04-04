// const imagemin = require('imagemin');
// const imageminPngquant = require('imagemin-pngquant');

const path = require('path');

module.exports = {
  friendlyName: 'Cache helper',

  description:
    'in memoery caching using cacheman: https://github.com/cayasso/cacheman',

  inputs: {
    imgPath: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'Cache operation done',
    },
    badRequest: {
      description: 'Error caching',
    },
  },

  fn: async function(inputs, exits) {
    try {
      // const { imgPath } = inputs;
      //
      // const outputFolder = path.join(
      //   __dirname,
      //   `../../../tempImages`,
      // );
      //
      // await imagemin([imgPath], {
      //   destination: outputFolder,
      //   plugins: [imageminPngquant()],
      // });

      return exits.success('ok');
    } catch (e) {
      console.log('error at transparent image helper', e);
      return exits.success('');
    }
  },
};
