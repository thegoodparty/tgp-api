const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;
const queueUrl = sails.config.custom.queueUrl || sails.config.queueUrl;

module.exports = {
  inputs: {
    message: {
      type: 'json',
      required: true,
    },
  },
  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
    },
  },
  fn: async function (inputs, exits) {
    try {
      if (!queueUrl) {
        return exits.success('not ok');
      }
      const { message } = inputs;
      const sqs = new SQSClient({
        region: 'us-west-2',
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });

      const uuid = Math.random().toString(36).substring(2, 12);

      const params = {
        MessageBody: JSON.stringify(message),
        MessageDeduplicationId: uuid, // Required for FIFO queues
        MessageGroupId: 'gp-queue', // Required for FIFO queues
        QueueUrl: queueUrl,
      };

      const command = new SendMessageCommand(params);
      const data = await sqs.send(command);
      console.log('Success', data.MessageId);
      return exits.success({ message: 'ok', id: data.MessageId });
    } catch (e) {
      console.log('error at enqueue', e);
      await sails.helpers.slack.errorLoggerHelper('error at enqueue', err);
      await sails.helpers.slack.errorLoggerHelper('original message', message);
      return exits.success({ message: 'not ok', e });
    }
  },
};
