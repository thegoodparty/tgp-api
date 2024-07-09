const patchUserMetaData = async (user, metaDataUpdate = {}) => {
  const metaData = JSON.parse(user.metaData);

  const updatedUser = await User.updateOne({
    id: user.id,
  }).set({
    metaData: JSON.stringify({
      ...metaData,
      ...metaDataUpdate,
    }),
  });

  return JSON.parse(updatedUser.metaData);
};

module.exports = { patchUserMetaData };
