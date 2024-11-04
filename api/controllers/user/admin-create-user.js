const randomize = require('randomatic');
const { USER_ROLES } = require('../../models/users/User');
module.exports = {
  friendlyName: 'Create user',

  description: 'Create a new user.',

  inputs: {
    firstName: {
      type: 'string',
      required: true,
    },
    lastName: {
      type: 'string',
      required: true,
    },
    email: {
      type: 'string',
      required: true,
      isUnique: true,
      isEmail: true,
    },
    role: {
      type: 'string',
      required: true,
      isIn: Object.values(USER_ROLES),
    },
  },
  exits: {
    success: {
      description: 'New user created successfully.',
    },
    emailAlreadyInUse: {
      statusCode: 409,
      description: 'The provided email address is already in use.',
    },
  },
  fn: async function AdminCreateUserAction(inputs, exits) {
    const { firstName, lastName, email, role } = inputs;
    const existing = await User.findOne({ email });
    if (existing) {
      return exits.emailAlreadyInUse();
    }
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      role,
      password: randomize('Aa0!', 10),
      hasPassword: true,
    }).fetch();
    return exits.success(newUser);
  },
};
