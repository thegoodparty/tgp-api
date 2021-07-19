/**
 * HelpfulTopic.js
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

    candidateId: {
      type: 'string',
      required: true,
      description: 'candidate id',
    },
    uuid: {
      type: 'string',
      required: true,
      description: 'User UUID to ensure one vote',
    },
    topicId: {
      type: 'string',
      required: true,
      description: 'topic id',
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
