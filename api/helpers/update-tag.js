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
    chamber: {
      description: 'Candidate chamber',
      example: 'presidential',
      required: true,
      type: 'string',
    },
    candidateId: {
      description: 'candidate id to be added',
      example: 1,
      required: true,
      type: 'number',
    },
    isIncumbent: {
      description: 'is the candidate an incumbent',
      example: false,
      required: false,
      type: 'boolean',
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
      let { email, listName, chamber, candidateId, isIncumbent, status } = inputs;

      listName = appBase === 'https://thegoodparty.org'
        ? listName
        : 'thegoodparty';
      const { lists } = await mailchimp.lists.getAllLists();
      const tgpList = lists.find(list => list.name === listName);

      // generate subscriberHash with email by using md5 that will be used as filter key
      const subscriberHash = md5(email);
      // check if the email is existed or not
      // (in most cases, this will not be necessary since we register user email when the user sign up.)
      try {
        await mailchimp.lists.getListMember(tgpList.id, subscriberHash)
      }
      catch (err) {
        // if email is not existed, subscribe that email
        try {
          await sails.helpers.addEmail(email, 'The Good Party');
        }
        catch (err) {

        }
      }

      let { candidate } = await sails.helpers.candidateFinder(
        candidateId,
        chamber,
        isIncumbent,
      );
      if (candidate) {
        let { name } = candidate;
        name = `${chamber} ${name}`;
        console.log(name)
        const obj = {
          body: {
            tags: [{ name, status }],
            is_syncing: true
          }
        }
        const response = await mailchimp.lists.updateListMemberTags(tgpList.id, subscriberHash, obj);
        return exits.success(response);
      }
      return exits.success({});
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
