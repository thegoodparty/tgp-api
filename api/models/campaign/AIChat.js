module.exports = {
  attributes: {
    assistant: {
      type: 'string',
      required: true,
    },
    thread: {
      type: 'string',
      unique: true,
    },
    user: {
      model: 'user',
      required: true,
    },
    campaign: {
      model: 'campaign',
    },
    data: {
      type: 'json',
    },
  },
};
