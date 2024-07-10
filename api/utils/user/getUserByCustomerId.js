const getUserByCustomerId = async (customerId) => {
  // TODO: user.metaData field is currently just a text-type field. It should be a JSONb field
  //  so that we can query it more efficiently and w/o haveing to use JSON.parse and JSON.stringify
  //  all over the place.
  const rawQuery = `
    SELECT * FROM "user" AS u WHERE u."metaData" LIKE '%${customerId}%';
  `;
  console.log(`rawQuery =>`, rawQuery);
  const { rows = [] } = await sails.getDatastore().sendNativeQuery(rawQuery);
  return rows[0];
};

module.exports = {
  getUserByCustomerId,
};
