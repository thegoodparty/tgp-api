module.exports = {
  friendlyName: 'create a',

  inputs: {
    name: {
      type: 'string',
      required: true,
    },
    icon: {
      type: 'string',
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

      const s3Icon = await sails.helpers.svgUploader(
        `${id}-topissue-icon.svg`,
        'top-issue-icons',
        icon,
      );

      await TopIssue.updateOne({
        id,
      }).set({
        icon: s3Icon,
      });

      return exits.success({
        message: 'created',
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
