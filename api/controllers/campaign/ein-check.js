const fakeLookup = async (name, ein) => new Promise((resolve) => {
  setTimeout(() => resolve({
    valid: true,
  }), 500);
});

module.exports = {
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
  fn: async function(_, exits) {
    const campaign = await sails.helpers.campaign.byUser(
      this.req.user,
    );
    const { name, ein } = this.req.query;

    if (!name || !ein || !campaign) {
      return exits.badRequest();
    }

    const { valid } = await fakeLookup(name, ein);

    return exits.success({
      valid,
    });
  },
};
