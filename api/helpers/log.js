module.exports = {
  friendlyName: 'Log helper',
  description: 'Make logging easier',

  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
    arg1: {
      type: 'ref',
      required: true,
    },
    arg2: {
      type: 'ref',
    },
    arg3: {
      type: 'ref',
    },
  },
  fn: async function (inputs) {
    try {
      const { arg1, arg2, arg3 } = inputs;
      if (arg1 && arg2 && arg3) {
        // log([`[${inputs.slug}]`, arg1, arg2, arg3]);
        console.log(`[${inputs.slug}]`, arg1, arg2, arg3);
      } else if (arg1 && arg2) {
        // log([`[${inputs.slug}]`, arg1, arg2]);
        console.log(`[${inputs.slug}]`, arg1, arg2);
      } else if (arg1) {
        //log([`[${inputs.slug}]`, arg1]);
        console.log(`[${inputs.slug}]`, arg1);
      }
    } catch (e) {}
    return;
  },
};

// function log(args) {
//   if (sails.config.environment === 'production') {
//     sails.log.info(...args);
//   } else {
//     console.log(...args);
//   }
// }
