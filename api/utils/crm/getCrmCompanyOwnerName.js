const getCrmCompanyOwnerName = async (crmCompany) => {
  let crmCompanyOwnerName = '';
  console.log(`crmCompany =>`, crmCompany);
  try {
    const crmCompanyOwner = await sails.helpers.crm.getCompanyOwner(
      crmCompany?.properties?.hubspot_owner_id,
    );
    const { firstName, lastName } = crmCompanyOwner || {};
    crmCompanyOwnerName = `${firstName ? `${firstName} ` : ''}${
      lastName ? lastName : ''
    }`;
  } catch (e) {
    console.error('error getting crm company owner', e);
  }
  return crmCompanyOwnerName;
};

module.exports = { getCrmCompanyOwnerName };
