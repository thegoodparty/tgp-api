const { md5 } = require('request/lib/helpers');
module.exports = {
  friendlyName: 'create a',

  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    icon: {
      type: 'string',
      allowNull: true
    },
  },

  exits: {
    success: {
      description: 'Created',
    },

    badRequest: {
      description: 'Error creating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { name, icon } = inputs;
      const { id } = await TopIssue.create({
        name,
      }).fetch();

      const iconUrl = icon ? await sails.helpers.svgUploader(
        `topissue-icon-${id}-${md5(icon)}.svg`,
        'top-issue-icons',
        icon,
      ) : null

      await TopIssue.updateOne({
        id,
      }).set({
        icon: iconUrl,
      });

      return exits.success({
        id,
        name,
        icon: iconUrl
      });
    } catch (e) {
      console.log('error at issue topIssue/create', e);
      return exits.badRequest({
        message: 'Error creating issue topIssue',
        e,
      });
    }
  },
};
