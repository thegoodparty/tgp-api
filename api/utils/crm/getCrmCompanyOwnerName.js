const { appEnvironment, PRODUCTION_ENV } = require('../appEnvironment');

/// map of emails to slack ids for mentioning users
const EMAIL_TO_SLACK_ID = {
  'sanjeev@goodparty.org': 'U07GUGCQ88M',
  ///
  'jared@goodparty.org': 'U01AY0VQFPE',
  'ryan@goodparty.org': 'U06T7RGGHEZ',
  'kyron.banks@goodparty.org': 'U07JWLYDDUH',
  'alex.barrio@goodparty.org': 'U0748BRPPJQ',
  'trey.stradling@goodparty.org': 'U06FPEP4QBZ',
  'alex.gibson@goodparty.org': 'U079ASLQ9G8',
  'dllane2012@gmail.com': 'U06U033GHDE',
  'aaron.soriano@goodparty.org': 'U07QXHVNDEJ',
  'nate.allen@goodparty.org': 'U07R9RNFTFX',
};

const isProd = appEnvironment === PRODUCTION_ENV;

const getCrmCompanyOwnerName = async (crmCompany, includeSlackId = false) => {
  let crmCompanyOwnerName = '';
  try {
    const crmCompanyOwner = await sails.helpers.crm.getCompanyOwner(
      crmCompany?.properties?.hubspot_owner_id,
    );
    const { firstName, lastName, email } = crmCompanyOwner || {};
    crmCompanyOwnerName = `${firstName ? `${firstName} ` : ''}${
      lastName ? lastName : ''
    }`;

    const slackId = EMAIL_TO_SLACK_ID[isProd ? email : 'sanjeev@goodparty.org'];
    if (includeSlackId && slackId) {
      crmCompanyOwnerName += ` - <@${slackId}>`;
    }
  } catch (e) {
    console.error('error getting crm company owner', e);
  }
  return crmCompanyOwnerName;
};

module.exports = { getCrmCompanyOwnerName };
