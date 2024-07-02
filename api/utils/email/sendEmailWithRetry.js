const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mailgunApiKey =
  sails.config.custom.MAILGUN_API || sails.config.MAILGUN_API;

const EMAIL_DOMAIN = 'mg.goodparty.org';
const mg = mailgun.client({ key: mailgunApiKey, username: 'api' });

async function sendEmailWithRetry(emailData, retryCount = 5) {
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      return await mg.messages.create(EMAIL_DOMAIN, emailData);
    } catch (error) {
      if (error.status === 429) {
        // Rate limit exceeded
        const retryAfter =
          parseInt(error.response.headers['retry-after'], 10) || 1; // Retry-After header is in seconds
        console.warn(
          `Rate limit exceeded. Retrying after ${retryAfter} seconds...`,
        );
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000)); // Convert to milliseconds
      } else {
        throw error; // Rethrow if not rate limit error
      }
    }
  }
  throw new Error('Exceeded maximum retry attempts');
}

module.exports = {
  sendEmailWithRetry,
};
