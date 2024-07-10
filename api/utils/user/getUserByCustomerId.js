const getUserByCustomerId = async (customerId) => {
  const rawQuery = `
    SELECT * FROM "user" WHERE "metaData"->>'customerId' = '${customerId}';
  `;
  console.log(`rawQuery =>`, rawQuery);
  const { rows = [] } = await sails.getDatastore().sendNativeQuery(rawQuery);
  return rows[0];
};

module.exports = {
  getUserByCustomerId,
};
