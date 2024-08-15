async function createCrmUser(firstName, lastName, email) {
  if (!email || !firstName) {
    // candidate page doesn't require email
    return;
  }

  const crmFields = [
    { name: 'firstName', value: firstName, objectTypeId: '0-1' },
    { name: 'lastName', value: lastName, objectTypeId: '0-1' },
    { name: 'email', value: email, objectTypeId: '0-1' },
  ];
  const formId = '37d98f01-7062-405f-b0d1-c95179057db1';

  let resolvedSource = 'loginPage';

  await sails.helpers.crm.submitForm(
    formId,
    crmFields,
    resolvedSource,
    'https://goodparty.org/login',
  );
}

module.exports = { createCrmUser };
