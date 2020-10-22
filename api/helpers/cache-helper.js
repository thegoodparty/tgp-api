const Cacheman = require('cacheman');
const cache = new Cacheman('tgp', { ttl: 36000 });

module.exports = {
  friendlyName: 'Cache helper',

  description:
    'in memoery caching using cacheman: https://github.com/cayasso/cacheman',

  inputs: {
    operation: {
      description: 'set, get or delete',
      type: 'string',
      required: true,
    },
    name: {
      description: 'cache key name',
      type: 'string',
      required: true,
    },
    item: {
      description: 'Data to cache',
      type: 'json',
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
      // https://github.com/cayasso/cacheman
      const { item, name, operation } = inputs;
      if (operation === 'get') {
        const cached = await cache.get(name);
        return exits.success(cached);
      }
      if (operation === 'set') {
        await cache.set(name, item);
        return exits.success();
      }
      if (operation === 'delete') {
        await cache.del(name);
        return exits.success();
      }

      return exits.badRequest();
    } catch (e) {
      console.log(e);
      return exits.badRequest();
    }
  },
};
