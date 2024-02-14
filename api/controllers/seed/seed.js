const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    let count = 0;
    let errors = [];
    try {
      const users = await User.find({ firstName: '' });
      for (const user of users) {
        try {
          const { name } = user;
          console.log('name', name);
          if (!name || name === '') {
            continue;
          }
          const prompt = `Given a name, split it into first name and last name and return the result in JSON format. For example, if the name is "John Doe", the output should be exactly as follows:
          {"firstName": "John", "lastName": "Doe"}
          Please provide the JSON object only, without any additional text or explanation.
          Name: ${name}`;
          let messages = [{ role: 'user', content: prompt }];
          const completion = await sails.helpers.ai.createCompletion(messages);
          aiResponse = completion.content;
          const parsedName = JSON.parse(aiResponse);
          if (parsedName.firstName && parsedName.lastName) {
            await User.updateOne({ id: user.id }).set({
              firstName: parsedName.firstName,
              lastName: parsedName.lastName,
            });
          }
          console.log('aiResponse', aiResponse, typeof aiResponse);
          count++;
        } catch (e) {
          console.log('Error in seed', e);
          errors.push(e);
        }
      }
      return exits.success({
        message: `updated ${count} users`,
        errors,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};
