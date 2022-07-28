module.exports = {
  friendlyName: 'Pulsar Social listening for brands',

  inputs: {
    page: {
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    const { page } = inputs;
    try {
      const query = `
        query BrandsPlusProfiles($page: Int, $limit: Int) {
          brands(page: $page, limit: $limit) {
            total
            nextPage
            brands {
              id
              name
              profiles {
                id
                source
                name
                plugged
              }
            }
          }
        }
      `;

      const variables = {
        page: page || 1,
      };

      const data = await sails.helpers.socialListening.pulsarQueryHelper(
        query,
        variables,
        'core',
      );

      if (data.brands && data.brands.brands) {
        const { brands } = data.brands;
        for (let i = 0; i < brands.length; i++) {
          const { name, id, profiles } = brands[i];

          await SocialBrand.findOrCreate(
            { brandId: id },
            {
              name,
              brandId: id,
              profiles,
            },
          );
          await SocialBrand.updateOne({ brandId: id }).set({
            name,
            brandId: id,
            profiles,
          });
        }
      }

      await sails.helpers.cacheHelper('clear', 'all');

      return exits.success({
        data,
      });
    } catch (e) {
      console.log('error at socialListening/brands');
      console.log(e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};
