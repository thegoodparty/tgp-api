const resolveUserName = (user) =>
  !user
    ? ''
    : user.firstName
    ? `${user.firstName} ${user.lastName}`
    : user.name
    ? user.name
    : '';

module.exports = { resolveUserName };
