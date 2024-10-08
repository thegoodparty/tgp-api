const updateCrmUserByUserId = async (id) => {
  const user = await User.findOne({ id })
  user && await sails.helpers.crm.updateUser(user)
}

module.exports = { updateCrmUserByUserId };
