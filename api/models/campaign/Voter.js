module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    voterId: {
      type: 'string',
      required: true,
      unique: true,
    },
    data: {
      type: 'json',
    },
    address: {
      type: 'string',
      required: true,
    },
    party: {
      type: 'string',
    },
    state: {
      type: 'string',
      required: true,
    },
    city: {
      type: 'string',
    },
    zip: {
      type: 'string',
    },
    lat: {
      type: 'string',
    },
    lng: {
      type: 'string',
    },
    geoHash: {
      type: 'string',
    },
    // has many
    surveys: {
      collection: 'survey',
      via: 'voter',
    },

    // many to many
    campaigns: {
      collection: 'campaign',
      via: 'voters',
    },
  },
};
