const { md5 } = require('request/lib/helpers');
module.exports = {
  friendlyName: 'edit topIssue',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    name: {
      type: 'string',
      required: true,
    },
    icon: {
      type: 'string',
      allowNull: true
    }
  },

  exits: {
    success: {
      description: 'Updated',
    },

    badRequest: {
      description: 'Error updating',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const { id, name, icon } = inputs;
      const iconUrl = !icon ?
        null :
        icon.startsWith('http') ?
          icon :
          await sails.helpers.svgUploader(
            `topissue-icon-${id}-${md5(icon)}.svg`,
            'top-issue-icons',
            icon
          )

      await TopIssue.updateOne({ id }).set({
        name,
        icon: iconUrl
      });

      return exits.success({
        id,
        name,
        icon: iconUrl
      });
    } catch (e) {
      console.log('error at topIssue/update', e);
      return exits.badRequest({
        message: 'Error updating topIssue',
        e,
      });
    }
  },
};
