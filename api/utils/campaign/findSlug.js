const slugify = require('slugify');

async function findSlug(name, suffix) {
  const slug = `${slugify(`${name}`, { lower: true })}${
    suffix ? `-${suffix}` : ''
  }`;
  const exists = await Campaign.findOne({ slug });
  if (!exists) {
    return slug;
  }
  for (let i = 1; i < 100; i++) {
    let slug = `${slugify(`${name}${i}`, { lower: true })}${
      suffix ? `-${suffix}` : ''
    }`;
    let exists = await Campaign.findOne({ slug });
    if (!exists) {
      return slug;
    }
  }
  return slug; // should not happen
}

module.exports = { findSlug };
