const mailchimp = require('@mailchimp/mailchimp_marketing');
const md5 = require('md5');

const apiKey = sails.config.custom.MAILCHIMP_API || sails.config.MAILCHIMP_API;
const server =
  sails.config.custom.MAILCHIMP_SERVER || sails.config.MAILCHIMP_SERVER;

mailchimp.setConfig({
  apiKey,
  server,
});

module.exports = {
  friendlyName: 'sign up email for updates',

  inputs: {
    email: {
      type: 'string',
      required: true,
    },
    notifications: {
      type: 'json',
      required: true,
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
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      const { email, notifications } = inputs;
      const listName =
        appBase === 'https://goodparty.org' ? 'Good Party' : 'Good Party Dev';
      const { lists } = await mailchimp.lists.getAllLists();
      const tgpList = lists.find(list => list.name === listName);
      // generate subscriberHash with email by using md5 that will be used as filter key
      const subscriberHash = md5(email);
      // check if the email is existed or not
      // (in most cases, this will not be necessary since we register user email when the user sign up.)
      try {
        await mailchimp.lists.getListMember(tgpList.id, subscriberHash);
      } catch (err) {
        // if email is not existed, subscribe that email
        // try {
        //   await sails.helpers.subscribeUser(email);
        // } catch (err) {}
      }
      let tags = [];
      if (notifications['new-job-notifications']) {
        tags.push({ name: 'JOB UPDATES', status: 'active' });
      }
      if (notifications['updates-notifications']) {
        tags.push({ name: 'GP UPDATES', status: 'active' });
      }
      const obj = {
        body: {
          tags,
          is_syncing: true,
        },
      };
      await mailchimp.lists.updateListMemberTags(
        tgpList.id,
        subscriberHash,
        obj,
      );
      return exits.success({
        message: 'created',
      });
    } catch (e) {
      console.log('error at updates/create', e);
      return exits.badRequest({
        message: 'Error creating updates signup',
      });
    }
  },
};
