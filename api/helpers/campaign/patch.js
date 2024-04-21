/* eslint-disable object-shorthand */

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    id: {
      type: 'number',
      required: true,
    },
    column: {
      type: 'string',
      required: true,
    },
    key: {
      type: 'string',
      required: true,
    },
    value: {
      type: 'ref',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'updated',
      responseType: 'ok',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { id, column, key, value } = inputs;
      if (
        column === 'details' &&
        column === 'campaignPlan' &&
        column === 'aiContent'
      ) {
        const query = `
        UPDATE "public.campaign"
        SET "${column}" = jsonb_set("${column}", $1, $2, true)
        WHERE "id" = $3
      `;
        const values = [
          `{${key}}`, // JSON path
          value, // New value
          id, // Campaign ID
        ];

        // Execute the raw query
        await Campaign.getDatastore().sendNativeQuery(query, values);
        const updated = await Campaign.findOne({ id });
        return exits.success(updated);
      }

      if (column === 'data') {
        const campaign = await Campaign.findOne({ id });
        const updatedData = {
          ...campaign.data,
          [key]: value,
        };
        const updated = await Campaign.updateOne({ id }).set({
          data: updatedData,
        });
        return exits.success(updated);
      }

      return exits.success(false);
    } catch (e) {
      console.log('error updating jsonb', e);
      return exits.success(false);
    }
  },
};
