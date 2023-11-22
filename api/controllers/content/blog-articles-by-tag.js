module.exports = {
  inputs: {
    tag: {
      type: 'string',
    },
  },

  exits: {
    success: {
      description: 'ok',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Error',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { tag } = inputs;

      const articleTags = (await Content.findOne({ key: 'articleTags' })).data;
      const slugs = articleTags[tag];
      const querySlugs = slugs.map((slug) => slug.slug);
      const articles = await Content.find({
        key: 'blogArticles',
        subKey: querySlugs,
      });

      const articleBySlugs = hashArticles(articles);
      const tagArticles = [];
      let tagName;
      if (slugs) {
        slugs.forEach((slug) => {
          tagArticles.push(articleBySlugs[slug.slug]);
          tagName = slug.tagName;
        });
      }
      tagArticles.sort((a, b) => {
        return new Date(b.publishDate) - new Date(a.publishDate);
      });

      return exits.success({
        articles: tagArticles,
        tagName,
      });
    } catch (err) {
      console.log('Error at content/blog-articles-by-section', err);
      await sails.helpers.slack.errorLoggerHelper(
        'Error at content/blog-articles-by-section.',
        err,
      );
      return exits.badRequest({
        message: 'Content fetch failed.',
      });
    }
  },
};

function hashArticles(articles) {
  const bySlug = {};
  articles.forEach((article) => {
    const { title, mainImage, publishDate, slug, summary } = article.data;
    bySlug[slug] = { title, mainImage, publishDate, slug, summary };
  });
  return bySlug;
}

const tags = [
  { slug: 'what-is-a-nonpartisan-election', tagName: 'Electoral Reform' },
  {
    slug: '7-hidden-forms-political-corruption',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'looking-north-pros-cons-ranked-choice-voting',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'open-primaries-understanding-the-mechanics-and-implications',
    tagName: 'Electoral Reform',
  },
  { slug: 'ranked-choice-voting-in-the-usa', tagName: 'Electoral Reform' },
  {
    slug: 'what-is-the-electoral-college-and-how-does-it-work',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'why-lifelong-term-limits-are-good-for-corruption-and-bad-for-everything-else',
    tagName: 'Electoral Reform',
  },
  { slug: 'electoral-college-pros-and-cons', tagName: 'Electoral Reform' },
  { slug: 'what-are-political-donations', tagName: 'Electoral Reform' },
  {
    slug: 'open-primary-vs-closed-primary-exploring-different-primary-election-systems',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'what-exactly-is-gerrymandering-why-is-it-so-bad',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'how-do-independent-candidates-get-on-the-ballot',
    tagName: 'Electoral Reform',
  },
  { slug: 'breaking-the-two-party-duopoly', tagName: 'Electoral Reform' },
  {
    slug: 'the-electoral-college-is-even-more-anti-democratic-than-you-probably-thought',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'swing-states-deciding-presidential-elections',
    tagName: 'Electoral Reform',
  },
  { slug: 'implications-of-citizens-united', tagName: 'Electoral Reform' },
  { slug: 'overcoming-electoral-barriers', tagName: 'Electoral Reform' },
  {
    slug: 'uncontested-elections-rot-democracy-from-the-inside-out',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'fundraising-and-the-race-to-the-bottom-how-the-two-party-system-brings-out',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'superdelegates-are-super-anti-democratic-how-political-parties-try-to-rig',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'time-to-bring-back-fairness-doctrine',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'can-independent-voters-vote-in-primaries',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'electoral-reform-how-to-challenge-ballot-access-laws',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'navigating-labyrinth-independents-gerrymandering',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'approval-voting-alternate-voting-system',
    tagName: 'Electoral Reform',
  },
  { slug: 'what-is-a-nonpartisan-election', tagName: 'Electoral Reform' },
  {
    slug: '7-hidden-forms-political-corruption',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'looking-north-pros-cons-ranked-choice-voting',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'open-primaries-understanding-the-mechanics-and-implications',
    tagName: 'Electoral Reform',
  },
  { slug: 'ranked-choice-voting-in-the-usa', tagName: 'Electoral Reform' },
  {
    slug: 'what-is-the-electoral-college-and-how-does-it-work',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'why-lifelong-term-limits-are-good-for-corruption-and-bad-for-everything-else',
    tagName: 'Electoral Reform',
  },
  { slug: 'electoral-college-pros-and-cons', tagName: 'Electoral Reform' },
  { slug: 'what-are-political-donations', tagName: 'Electoral Reform' },
  {
    slug: 'open-primary-vs-closed-primary-exploring-different-primary-election-systems',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'what-exactly-is-gerrymandering-why-is-it-so-bad',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'how-do-independent-candidates-get-on-the-ballot',
    tagName: 'Electoral Reform',
  },
  { slug: 'breaking-the-two-party-duopoly', tagName: 'Electoral Reform' },
  {
    slug: 'the-electoral-college-is-even-more-anti-democratic-than-you-probably-thought',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'swing-states-deciding-presidential-elections',
    tagName: 'Electoral Reform',
  },
  { slug: 'implications-of-citizens-united', tagName: 'Electoral Reform' },
  { slug: 'overcoming-electoral-barriers', tagName: 'Electoral Reform' },
  {
    slug: 'uncontested-elections-rot-democracy-from-the-inside-out',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'fundraising-and-the-race-to-the-bottom-how-the-two-party-system-brings-out',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'superdelegates-are-super-anti-democratic-how-political-parties-try-to-rig',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'time-to-bring-back-fairness-doctrine',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'can-independent-voters-vote-in-primaries',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'electoral-reform-how-to-challenge-ballot-access-laws',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'navigating-labyrinth-independents-gerrymandering',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'approval-voting-alternate-voting-system',
    tagName: 'Electoral Reform',
  },
  { slug: 'what-is-a-nonpartisan-election', tagName: 'Electoral Reform' },
  {
    slug: '7-hidden-forms-political-corruption',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'looking-north-pros-cons-ranked-choice-voting',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'open-primaries-understanding-the-mechanics-and-implications',
    tagName: 'Electoral Reform',
  },
  { slug: 'ranked-choice-voting-in-the-usa', tagName: 'Electoral Reform' },
  {
    slug: 'what-is-the-electoral-college-and-how-does-it-work',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'why-lifelong-term-limits-are-good-for-corruption-and-bad-for-everything-else',
    tagName: 'Electoral Reform',
  },
  { slug: 'electoral-college-pros-and-cons', tagName: 'Electoral Reform' },
  { slug: 'what-are-political-donations', tagName: 'Electoral Reform' },
  {
    slug: 'open-primary-vs-closed-primary-exploring-different-primary-election-systems',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'what-exactly-is-gerrymandering-why-is-it-so-bad',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'how-do-independent-candidates-get-on-the-ballot',
    tagName: 'Electoral Reform',
  },
  { slug: 'breaking-the-two-party-duopoly', tagName: 'Electoral Reform' },
  {
    slug: 'the-electoral-college-is-even-more-anti-democratic-than-you-probably-thought',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'swing-states-deciding-presidential-elections',
    tagName: 'Electoral Reform',
  },
  { slug: 'implications-of-citizens-united', tagName: 'Electoral Reform' },
  { slug: 'overcoming-electoral-barriers', tagName: 'Electoral Reform' },
  {
    slug: 'uncontested-elections-rot-democracy-from-the-inside-out',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'fundraising-and-the-race-to-the-bottom-how-the-two-party-system-brings-out',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'superdelegates-are-super-anti-democratic-how-political-parties-try-to-rig',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'time-to-bring-back-fairness-doctrine',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'can-independent-voters-vote-in-primaries',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'electoral-reform-how-to-challenge-ballot-access-laws',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'navigating-labyrinth-independents-gerrymandering',
    tagName: 'Electoral Reform',
  },
  {
    slug: 'approval-voting-alternate-voting-system',
    tagName: 'Electoral Reform',
  },
];
