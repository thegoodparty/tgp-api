// https://imageoptim.com/api
const axios = require('axios');
const fs = require('fs');

const imageOptimkey =
  sails.config.custom.imageOptimkey || sails.config.imageOptimkey;
const baseUrl = `https://im2.io/${imageOptimkey}/`;

module.exports = {
  friendlyName: 'Otimize Image using imageOptim API',

  inputs: {
    imgPath: {
      type: 'string',
      required: true,
    },
    outputFile: {
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
      const { imgPath, outputFile } = inputs;
      const url = `${baseUrl}500,scale-down,quality=low,format=png/${imgPath}`;
      const { data } = await axios({
        url,
        method: 'POST',
        responseType: 'arraybuffer',
      });
      await fs.writeFileSync(outputFile, data);
      return exits.success('ok');
    } catch (e) {
      console.log('error at transparent image helper', e);
      return exits.success('');
    }
  },
};
