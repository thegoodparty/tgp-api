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
        column === 'details' ||
        column === 'campaignPlan' ||
        column === 'aiContent'
      ) {
        // Construct the query to set the column to an empty object if it's null, then use jsonb_set
        const query = `
        UPDATE "campaign"
        SET "${column}" = COALESCE("${column}", '{}') -- Initialize to empty JSON if null
        WHERE "id" = ${id};
        -- Now update the specified path
        UPDATE "campaign"
        SET "${column}" = jsonb_set("${column}", '{${key}}', '"${value}"', true)
        WHERE "id" = ${id};
      `;

        // Execute the raw query
        await Campaign.getDatastore().sendNativeQuery(query);
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
