/**
 * HelpfulArticle.js
 * Used for the admin - collect how many helpful or not helpful comments we get for an article
 *
 * @description :: A stringified json of our cms content
 * @docs        :: https://sailsjs.com/docs/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    //  ╔═╗╦═╗╦╔╦╗╦╔╦╗╦╦  ╦╔═╗╔═╗
    //  ╠═╝╠╦╝║║║║║ ║ ║╚╗╔╝║╣ ╚═╗
    //  ╩  ╩╚═╩╩ ╩╩ ╩ ╩ ╚╝ ╚═╝╚═╝

    cmsId: {
      type: 'string',
      required: true,
      description: 'contentful id of the article',
    },
    uuid: {
      type: 'string',
      required: true,
      description: 'User UUID to ensure one vote',
    },
    isHelpful: {
      type: 'boolean',
      required: true,
      description: 'was the article helpful',
    },
    feedback: {
      type: 'string',
      required: false,
      description: 'text feedback',
    },
  },
};
