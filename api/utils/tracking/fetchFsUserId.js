const axios = require('axios');
const fetchFsUserId = async (headers, { id: userId, firstName, lastName }) => {
  try {
    const response = await axios.get(
      `https://api.fullstory.com/v2/users?uid=${userId}`,
      {
        headers,
      },
    );
    if (response?.data?.results?.length === 1) {
      return response.data.results[0].id;
    }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // User does not exist, create them
      const createResponse = await axios.post(
        'https://api.fullstory.com/v2/users',
        {
          uid: `local-matt-${userId}`,
          display_name: `${firstName} ${lastName}`, // Customize this as needed
        },
        {
          headers,
        },
      );
      return createResponse.data.id;
    } else {
      throw error;
    }
  }
};

module.exports = {
  fetchFsUserId,
};
