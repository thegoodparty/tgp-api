/**
 * content/update
 *
 * @description :: Updates the  content from our CMS.
 * @help        :: See https://sailsjs.com/documentation/concepts/actions-and-controllers
 */

// TODO: abstract this out so it can also be used in `helpers/contentful.js`, extracting each
//  conditional content type processor into a function property on the schemaConfig object for that
//  given type.
const schemaConfig = {
  faqArticles: {
    subKey: 'id',
  },
  blogSections: {
    subKey: 'slug',
  },
  elections: {
    subKey: 'slug',
  },
  aiContentCategories: {
    subKey: 'name',
  },
  articleCategories: {
    subKey: 'name',
  },
  blogArticles: {
    subKey: 'slug',
  },
  glossaryItems: {
    subKey: 'slug',
  },
  goodPartyTeamMembers: {
    subKey: 'fullName',
  },
  teamMilestones: {
    subKey: 'id',
  },
};

module.exports = {
  friendlyName: 'All Content',

  description: 'Updates the  content from our CMS',

  inputs: {},

  exits: {
    success: {
      description: 'Able to fetch all content',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Phone Format Error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      // fetch content from the api
      const content = await sails.helpers.contentful();
      console.log(Object.keys(content));
      const keys = Object.keys(content);

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = content[key];

        if (schemaConfig[key]) {
          const { subKey } = schemaConfig[key];
          for (let j = 0; j < value.length; j++) {
            await updateOrCreate(key, subKey, {
              ...value[j],
              order: j,
            });
          }
        } else {
          //just save it
          await updateOrCreate(key, false, value);
        }
      }

      return exits.success();
    } catch (err) {
      console.log('content error');
      console.log(err);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at content/update',
        JSON.stringify(err),
      );
      return exits.badRequest({
        message: 'Content fetch failed. Please load again.',
      });
    }
  },
};

async function updateOrCreate(key, subKey, value) {
  if (subKey) {
    const existing = await Content.findOne({ key, subKey: value[subKey] });
    if (existing) {
      await Content.updateOne({ id: existing.id }).set({ data: value });
    } else {
      await Content.create({ key, subKey: value[subKey], data: value });
    }
  } else {
    const existing = await Content.findOne({ key });
    if (existing) {
      await Content.updateOne({ id: existing.id }).set({ data: value });
    } else {
      await Content.create({ key, data: value });
    }
  }
}
