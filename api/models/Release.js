/**
 * Release.js
 *
 * @description :: A model definition represents a database table/collection.
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝
    releaseType: {
      type: 'string',
      required: true,
    },
    releaseDate: {
      type: 'string',
      required: true,
    },
    releaseNote: {
      type: 'string',
      required: true,
    },
    tags: {
      type: 'json',
    },
    isOnline: {
      type: 'boolean',
    },
  },
};
