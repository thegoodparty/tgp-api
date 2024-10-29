const slugify = require('slugify');

function buildSlug(name, suffix) {
  return `${slugify(`${name}`, { lower: true })}${suffix ? `-${suffix}` : ''}`;
}

async function findSlug(name, suffix) {
  const slug = buildSlug(name, suffix);
  const exists = await Campaign.findOne({ slug });
  if (!exists) {
    return slug;
  }
  for (let i = 1; i < 100; i++) {
    let slug = buildSlug(`${name}${i}`, suffix);
    let exists = await Campaign.findOne({ slug });
    if (!exists) {
      return slug;
    }
  }
  return slug; // should not happen
}

module.exports = { findSlug, buildSlug };
