module.exports = {
  attributes: {
    assistant: {
      type: 'string',
      required: true,
    },
    thread: {
      type: 'string',
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
