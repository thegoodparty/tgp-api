module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    electionType: {
      type: 'string',
      required: true,
    },
    electionLocation: {
      type: 'string',
    },
    electionDistrict: {
      type: 'string',
    },
    counts: {
      type: 'json',
    },
  },
};
