const axios = require('axios');
const { patchUserMetaData } = require('../user/patchUserMetaData');

const fullStoryKey =
  sails.config.custom.fullStoryKey || sails.config.fullStoryKey;

const appBase = sails.config.custom.appBase || sails.config.appBase;

const correctFsUserId = async (headers, userId) => {
  console.log('Correct FsUserId for UID: ', userId);
  if (!fullStoryKey) {
    // for non production env.
    return exits.success('no api key');
  }
  // if (appBase === 'http://localhost:4000') {
  //   console.log('fullstory helpers disabled on localhost');
  //   return exits.success('fullstory helpers disabled on localhost');
  // }

  // Rename fsUserId to oldFsUserId
  const user = await User.findOne({ id: userId });
  patchUserMetaData(user, { oldFsUserId: user.metaData.fsUserId});
  // await User.updateOne({ id: userId})
  //   .set({
  //     metaData: {
  //       ...metaData,
  //       oldFsUserId: metaData.fsUserId,
  //     },
  //   }).meta({fetch: true});

  // Query FS by our UID to get REAL FS id.
  const fsUser = await axios.get(
    `https://api.fullstory.com/v2/users/`, {
      params: {
        uid: userId
      },
      headers,
    }
  );
  if (fsUser.results.length > 1) {
    throw new Error('Get User call to FS by UID should only return 1 user');
  }
  
  const correctFsUserId = fsUser.results[0].id;
  console.log('correctFsUserId: ', correctFsUserId);
  // Save real fsId to metaData under 'fsUserId'

  patchUserMetaData(user, { fsUserId: correctFsUserId});
  // await User.updateOne({ id: userId })
  //   .set({
  //     metaData: {
  //       ...metaData,
  //       fsUserId: correctFsUserId
  //     },
  //   })
  //   .meta({ fetch: true});

  // Send post with properties update with real fsId
    // If successful, delete profile for oldFsUserId
    // If error, log the error

  try {
    await sails.helpers.fullstory.customAttr(userId);
  } catch (error) {
    console.log('Something went wrong while trying to update FS user attributes');
    throw error;
  }
};

module.exports = {
  correctFsUserId
};
