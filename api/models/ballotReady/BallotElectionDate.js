module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    positionId: {
      type: 'string',
      required: true,
    },
    officeName: {
      type: 'string',
      required: true,
    },
    electionDay: {
      type: 'string',
      required: true,
    },
    mtfcc: {
      type: 'string',
    },
    geoId: {
      type: 'string',
    },
  },
};
