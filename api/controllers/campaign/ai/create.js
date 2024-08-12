/* eslint-disable object-shorthand */

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    key: {
      type: 'string',
      required: true,
    },

    regenerate: {
      type: 'boolean',
    },
    editMode: {
      type: 'boolean',
    },
    chat: {
      type: 'ref',
    },
    inputValues: {
      type: 'json',
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;
      const { key, regenerate, editMode, chat, inputValues } = inputs;

      await sails.helpers.queue.consumer();

      const campaignObj = await sails.helpers.campaign.byUser(user);
      if (!campaignObj) {
        return exits.badRequest('No campaign');
      }
      let { aiContent, slug, id } = campaignObj;
      if (!aiContent) {
        aiContent = {};
      }

      if (!aiContent.generationStatus) {
        aiContent.generationStatus = {};
      }

      if (
        !regenerate &&
        aiContent.generationStatus[key] !== undefined &&
        aiContent.generationStatus[key].status !== undefined &&
        aiContent.generationStatus[key].status === 'processing'
      ) {
        return exits.success({
          status: 'processing',
          step: 'waiting',
          key,
        });
      }
      const existing = aiContent[key];

      if (
        !editMode &&
        aiContent.generationStatus[key] !== undefined &&
        aiContent.generationStatus[key].status === 'completed' &&
        existing
      ) {
        return exits.success({
          status: 'completed',
          chatResponse: aiContent[key],
        });
      }

      // generating a new ai content here

      const cmsPrompts = await sails.helpers.ai.getPrompts();
      const keyNoDigits = key.replace(/\d+/g, ''); // we allow multiple keys like key1, key2
      let prompt = cmsPrompts[keyNoDigits];
      prompt = await sails.helpers.ai.promptReplace(prompt, campaignObj);
      if (!prompt || prompt === '') {
        await sails.helpers.slack.errorLoggerHelper('empty prompt replace', {
          cmsPrompt: cmsPrompts[keyNoDigits],
          promptAfterReplace: prompt,
          campaignObj,
        });
        return exits.badRequest('No prompt');
      }
      await sails.helpers.slack.aiLoggerHelper('prompt', {
        cmsPrompt: cmsPrompts[keyNoDigits],
        promptAfterReplace: prompt,
      });

      if (!aiContent.generationStatus[key]) {
        aiContent.generationStatus[key] = {};
      }
      aiContent.generationStatus[key].status = 'processing';
      aiContent.generationStatus[key].prompt = prompt;
      aiContent.generationStatus[key].existingChat = chat || [];
      aiContent.generationStatus[key].inputValues = inputValues;
      aiContent.generationStatus[key].createdAt = new Date().valueOf();

      await sails.helpers.campaign.patch(
        id,
        'aiContent',
        'generationStatus',
        aiContent.generationStatus,
      );

      const queueMessage = {
        type: 'generateAiContent',
        data: {
          slug,
          key,
          regenerate,
        },
      };

      await sails.helpers.queue.enqueue(queueMessage);
      await sails.helpers.slack.aiLoggerHelper(
        'Enqueued AI prompt',
        queueMessage,
      );

      await sails.helpers.queue.consumer();

      return exits.success({
        status: 'processing',
        step: 'created',
        key,
      });
    } catch (e) {
      console.log('Error generating AI response', e);
      await sails.helpers.slack.errorLoggerHelper(
        'Error generating AI response',
        e,
      );
      if (e.data && e.data.error) {
        console.log('*** error*** :', e.data.error);
        return exits.badRequest();
      }
      return exits.badRequest();
    }
  },
};
