const { getUserByCustomerId } = require('../user/getUserByCustomerId');
const getCampaignByCustomerId = async (customerId) => {
  const user = await getUserByCustomerId(customerId);
  if (!user) {
    throw 'No user found with given customerId';
  }
  return await sails.helpers.campaign.byUser(user.id);
};

module.exports = { getCampaignByCustomerId };
