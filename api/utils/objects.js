/**
 * helper to get an object from a subset of another object's keys
 * @param {object} obj Source object
 * @param {string[]} keys Array of keys to pick
 * @returns {object}
 */
function pick(obj, keys) {
  if (typeof obj !== 'object' || obj === null || !Array.isArray(keys)) {
    throw new Error('invalid args');
  }

  return (
    keys
      .filter((key) => key in obj)
      // eslint-disable-next-line no-return-assign
      .reduce((obj2, key) => ((obj2[key] = obj[key]), obj2), {})
  );
}

module.exports = {
  pick,
};
