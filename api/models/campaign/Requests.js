module.exports = {
  attributes: {
    user: {
      description: 'User making the request',
      model: 'user',
      required: true,
    },

    candidateEmail: {
      description:
        'Email of the candidate of the campaign being requested to join',
      type: 'string',
      required: true,
      isEmail: true,
    },

    role: {
      description: 'Role being requested',
      type: 'string',
      isIn: ['volunteer', 'manager', 'staff'],
      required: true,
    },

    campaign: {
      model: 'campaign',
    },

    granted: {
      description:
        'Whether the request has been granted or not, or not acted on yet',
      type: 'boolean',
    },
  },
};
