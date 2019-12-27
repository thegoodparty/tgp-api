/**
 * Invited.js
 *
 * @description :: Dictionary. Key - invited guest. value - array of users that invited the guest.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    phone: {
      type: 'string',
      required: true,
      unique: true,
      maxLength: 11,
      example: '3101234567',
    },

    invitedBy: {
      type: 'string',
      description:
        'stringified array of all the users that invited the guest (phone)',
      example: '"[{id: 2, name: "John Smith"}]"',
      required: true,
    },
  },
};
