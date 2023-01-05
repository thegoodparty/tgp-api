const slugify = require('slugify');

module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      let count = 0;
      const candidates = await Candidate.find();
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        let slug = candidate.slug;
        if (!slug || slug === '') {
          slug = await findSlug(candidate);
        }
        const data = JSON.parse(candidate.data);
        data.slug = slug;
        await Candidate.updateOne({ id: candidate.id }).set({
          slug,
          data: JSON.stringify(data),
        });
        console.log('slug', slug);
        count++;
      }

      return exits.success({
        message: `Updated ${count} users`,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        error: JSON.stringify(e),
      });
    }
  },
};

async function findSlug(candidate) {
  const { firstName, lastName } = candidate;
  const slug = slugify(`${firstName}-${lastName}`, { lower: true });
  const exists = await Candidate.findOne({ slug });
  if (!exists) {
    return slug;
  }
  for (let i = 1; i < 100; i++) {
    let slug = slugify(`${firstName}-${lastName}${i}`, { lower: true });
    let exists = await Candidate.findOne({ slug });
    if (!exists) {
      return slug;
    }
  }
  return slug; // should not happen
}
