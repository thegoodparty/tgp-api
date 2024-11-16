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

const dateToISO8601DateString = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;

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

function formatDateForGoogleSheets(date) {
  const month = date.getMonth() + 1; // Months are zero based
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

module.exports = {
  getFormattedDateString,
  convertISO8601DateStringToUSDateString,
  dateToISO8601DateString,
  formatUSDateString,
  formatDateForGoogleSheets,
};
