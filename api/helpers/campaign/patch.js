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
      type: 'ref', //not required to allow empty string
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
        // Check if the value is a JSON object
        let formattedValue;
        if (typeof value === 'object') {
          formattedValue = `'${JSON.stringify(value)}'::jsonb`; // Convert JSON object to string and type cast
        } else if (typeof value === 'boolean') {
          formattedValue = value;
        } else if (typeof value === 'string') {
          formattedValue = `'"${value}"'`; // Just a simple string wrapped in single quotes
        } else if (value === null) {
          formattedValue = 'null';
        } else {
          formattedValue = value;
        }

        const validKeyRegex = /^[a-zA-Z0-9_]+$/;
        if (!validKeyRegex.test(key)) {
          throw new Error('Invalid JSON path key');
        }

        // Define query using parameterized values
        const query = `
          UPDATE "campaign"
          SET "${column}" = COALESCE("${column}", '{}') -- Initialize to empty JSON if null
          WHERE "id" = $1;
          
          -- Now update the specified path
          UPDATE "campaign"
          SET "${column}" = jsonb_set("${column}", ARRAY[$2], $3::jsonb, true)
          WHERE "id" = $1;
        `;

        // Send parameterized values to avoid SQL injection
        const parameters = [id, key, formattedValue];

        // Execute the raw query with sanitized inputs
        await Campaign.getDatastore().sendNativeQuery(query, parameters);

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
