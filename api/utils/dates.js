const getFormattedDateString = (date) =>
  date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const ISO8601_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const convertISO8601DateStringToUSDateString = (dateString) => {
  if (!ISO8601_DATE_REGEX.test(dateString)) {
    sails.helpers.slack.errorLoggerHelper(
      `Invalid ISO8601 date string: ${dateString}`,
    );
    return null;
  }
  const [year, month, day] = dateString.split('-');
  return `${month}/${day}/${year}`;
};

const US_DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const formatUSDateString = (dateString) => {
  if (!US_DATE_REGEX.test(dateString)) {
    sails.helpers.slack.errorLoggerHelper(
      `Invalid US date string: ${dateString}`,
    );
    return null;
  }
  return getFormattedDateString(new Date(dateString));
};

module.exports = {
  getFormattedDateString,
  convertISO8601DateStringToUSDateString,
  formatUSDateString,
};