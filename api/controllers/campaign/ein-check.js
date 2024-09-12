const fakeLookup = async (name, ein) =>
  new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          valid: true,
        }),
      500,
    );
  });

module.exports = {
  inputs: {
    name: {
      type: 'string',
      required: true,
      description: 'Entity name',
    },
    ein: {
      type: 'string',
      required: true,
      description: 'EIN',
    },
  },
  exits: {
    success: {
      description: 'Successfull EIN lookup',
    },
    notFound: {
      description: 'Not Found',
      responseType: 'notFound',
    },
    badRequest: {
      description: 'Missing EIN or entity name',
      responseType: 'badRequest',
    },
  },
  fn: async function (inputs, exits) {
    const campaign = await sails.helpers.campaign.byUser(this.req.user?.id);
    const { name, ein } = inputs;

    if (!campaign) {
      return exits.badRequest();
    }

    const { valid } = await fakeLookup(name, ein);

    return exits.success({
      valid,
    });
  },
};
