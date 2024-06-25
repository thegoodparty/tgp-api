const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {},

  fn: async function (inputs, exits) {
    try {
      let domain;
      let userCookieName = 'user';
      let tokenCookieName = 'token';
      if (appBase === 'http://localhost:4000') {
        domain = 'localhost';
      } else {
        domain = '.goodparty.org';
        if (appBase === 'https://goodparty.org') {
          userCookieName = 'user_prod';
          tokenCookieName = 'token_prod';
        } else if (appBase === 'https://dev.goodparty.org') {
          userCookieName = 'user_dev';
          tokenCookieName = 'token_dev';
        } else if (appBase === 'https://qa.goodparty.org') {
          userCookieName = 'user_qa';
          tokenCookieName = 'token_qa';
        }
      }

      return exits.success({
        domain,
        userCookieName,
        tokenCookieName,
      });
    } catch (e) {
      await sails.helpers.slack.errorLoggerHelper(
        'Error at get-cookie-domain',
        e,
      );
      return exits.success('');
    }
  },
};
