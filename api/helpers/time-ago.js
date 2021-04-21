const timeago = require('time-ago');
const moment = require('moment');
module.exports = {
  friendlyName: 'Phone Verification helper',

  description: 'Phone verification helper using twilio API',

  inputs: {
    date: {
      type: 'number',
    },
  },
  fn: async function (inputs, exits) {
    try {
      const { date } = inputs;
      let ago = timeago.ago(new Date(date));
      let momentDate = moment(date);
      let momentCurrent = moment(new Date());
      if (ago.includes('ms') || ago.includes('second') || (ago.includes('minute') && parseInt(ago[0]) <= 5)) {
        ago = 'moments ago';
      } else if (ago === '24 hours ago') {
        ago = '1 day ago';
      } else if (ago.includes('week')) {
        const days = momentCurrent.diff(momentDate, 'days');
        ago = `${days} days ago`;
        if(days > 29) {
          ago = '1 month ago';
        }
      } else if (ago === '12 months ago') {
        ago = '1 year ago';
      }
      return exits.success(ago);
    } catch (e) {
      return exits.badRequest('');
    }
  },
};
