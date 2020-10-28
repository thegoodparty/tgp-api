const mailchimp = require('@mailchimp/mailchimp_marketing');
const md5 = require("md5");

const apiKey = sails.config.custom.MAILCHIMP_API || sails.config.MAILCHIMP_API;
const server =
  sails.config.custom.MAILCHIMP_SERVER || sails.config.MAILCHIMP_SERVER;

mailchimp.setConfig({
  apiKey,
  server,
});

module.exports = {
  friendlyName: 'Votes Needed Helper',

  inputs: {
    email: {
      type: 'string',
      isEmail: true,
      required: true,
    },
    listName: {
      type: 'string',
      required: true,
    },
    tag: {
      type: 'string',
      required: true,
    },
    status: {
      type: 'string',
      required: true,
    }
  },
  exits: {
    success: {
      description: 'Tag has been added to Email',
    },

    badRequest: {
      description: 'Error adding tag',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const appBase = sails.config.custom.appBase || sails.config.appBase;
      let { email, listName, tag, status } = inputs;
      listName = appBase === 'https://thegoodparty.org'
        ? listName
        : 'thegoodparty';
      const { lists } = await mailchimp.lists.getAllLists();
      const tgpList = lists.find(list => list.name === listName);
      const subscriberHash = md5(email);
      const obj = {
        body: {
          tags: [{ name: tag, status }],
          is_syncing: true
        }
      }
      const response = await mailchimp.lists.updateListMemberTags(tgpList.id, subscriberHash, obj);
      return exits.success(response);
    } catch (err) {
      console.log(err);
      if (err && err.response && err.response.text) {
        const parsedText = JSON.parse(err.response.text);
        return exits.badRequest({
          message: `Error: ${parsedText.title}`,
        });
      } else {
        return exits.badRequest({ message: 'Error subscribing email' });
      }
    }
  },
};
