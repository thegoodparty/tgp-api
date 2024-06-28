module.exports = {
  friendlyName: 'List election deadlines',

  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      // const deadlines = await ElectionDeadlines.find({});

      return exits.success({
        ok: true,
      });
    } catch (e) {
      console.error('error at campaign/cron/scheduled-emails', e);
      return exits.badRequest({
        message: 'error at campaign/cron/scheduled-emails',
        e,
      });
    }
  },
};
