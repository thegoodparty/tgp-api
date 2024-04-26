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
        if (typeof value === 'undefined') {
          console.log('undefined value');
          return exits.success(false);
        }
        // Check if the value is a JSON object
        let formattedValue;
        if (typeof value === 'object') {
          formattedValue = JSON.stringify(value); // Ensure proper JSON formatting
        } else if (typeof value === 'boolean' || typeof value === 'number') {
          formattedValue = value; // Directly pass boolean or number
        } else if (typeof value === 'string') {
          formattedValue = JSON.stringify(value); // Ensure the string is JSON-safe
        } else if (value === null) {
          formattedValue = null;
        } else {
          throw new Error('Invalid value type');
        }

        const validKeyRegex = /^[a-zA-Z0-9_]+$/;
        if (!validKeyRegex.test(key)) {
          throw new Error('Invalid JSON path key');
        }

        // Prepared statement for initializing the column
        const queryInit = `
        UPDATE "campaign"
        SET "${column}" = COALESCE("${column}", '{}') -- Initialize to empty JSON if null
        WHERE "id" = $1;
      `;

        // Prepared statement for updating JSONB
        const queryUpdate = `
        UPDATE "campaign"
        SET "${column}" = jsonb_set("${column}", ARRAY[$2], $3, true)
        WHERE "id" = $1;
      `;

        // Send parameterized values to avoid SQL injection
        const parametersInit = [id];
        const parametersUpdate = [id, key, formattedValue];

        // Execute the queries separately
        await Campaign.getDatastore().sendNativeQuery(
          queryInit,
          parametersInit,
        ); // First statement
        await Campaign.getDatastore().sendNativeQuery(
          queryUpdate,
          parametersUpdate,
        ); // Second statement

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
      console.log('ERROR: invalid column');
      return exits.success(false);
    } catch (e) {
      console.log('error updating jsonb', e);
      return exits.success(false);
    }
  },
};
