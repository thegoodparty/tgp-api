const { patchUserMetaData } = require('../../user/patchUserMetaData');
const clearCheckoutSession = async (event) => {
  const session = event.data.object;
  console.log(`checkout session expired =>`, session);
  const { userId } = session.metadata;
  if (!userId) {
    throw 'No userId found in expired checkout session metadata';
  }

  const user = await User.findOne({ id: userId });
  if (!user) {
    throw 'No user found with given expired checkout session userId';
  }
  await patchUserMetaData(user, { checkoutSessionId: null });
};

module.exports = {
  clearCheckoutSession,
};
