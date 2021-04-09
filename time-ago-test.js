const timeago = require('time-ago');
const moment = require('moment');
console.log(new Date());
const dateString = '2021-04-01T06:59:27.197Z';
let ago = timeago.ago(new Date(dateString));
let momentDate = moment(dateString);
let momentCurrent = moment(new Date());
if(ago.includes('minute') && parseInt(ago[0]) <= 5) {
  ago = 'Moments ago';
}
else if(ago === '24 hours ago') {
  ago = '1 day ago';
}
else if(ago.includes('week')) {
  const days = momentCurrent.diff(momentDate, 'days');
  ago = `${days} days ago`;
}
else if(ago === '12 months ago') {
  ago = '1 year ago';
}
console.log(ago);