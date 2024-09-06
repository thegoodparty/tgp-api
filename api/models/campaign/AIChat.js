/*
Each conversation is its own object 
And then a campaign has many objects.
We don't want to load all the chat history.

model aiChat
He thinks to do it as a json object.

Keep in mind people may want to regenerate one section of a conversation.

Tomer thinks that it should be done via controller logic. Ie: 0-6 
They only let you regenerate the most recent thing that you said. 
*/

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
