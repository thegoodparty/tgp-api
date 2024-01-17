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
