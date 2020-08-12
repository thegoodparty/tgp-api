/**
 * KeyValue.js
 * A general key value store
 * TODO: I am not sure how to enforce it at the model level. Will be handled at the helper level.
 *
 * @description :: A genral key value store.
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
      unique: true,
      description: 'unique key',
    },
    value: {
      type: 'string',
      required: true,
      description: 'string value',
    },
  },
};
