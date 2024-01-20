// sails run indexes
// to add the index to the votersearch table.

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    voter: {
      model: 'voter',
      required: true,
    },
    l2ColumnName: {
      type: 'string',
      required: true,
    },
    l2ColumnValue: {
      type: 'string',
      required: true,
    },
  },
};
