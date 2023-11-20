/**
 * Content.js
 * We should always have one entry for the content.
 * TODO: I am not sure how to enforce it at the model level. Will be handled at the helper level.
 *
 * @description :: A stringified json of our cms content
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    key: {
      type: 'string',
      required: true,
    },
    subKey: {
      type: 'string',
    },
    data: {
      type: 'json',
      required: true,
    },
  },
};
