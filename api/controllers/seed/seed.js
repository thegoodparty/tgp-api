const slugify = require('slugify');

const topIssues = {
  positions: [
    {
      createdAt: 1649095556912,
      updatedAt: 1658420397139,
      id: 13,
      name: 'Wealth Tax',
      topIssue: null,
    },
    {
      createdAt: 1649095557329,
      updatedAt: 1649095557329,
      id: 101,
      name: 'Breakup Monopolies',
      topIssue: {
        createdAt: 1649095557324,
        updatedAt: 1649095557324,
        id: 24,
        name: 'Business',
      },
    },
    {
      createdAt: 1649095557376,
      updatedAt: 1649095557376,
      id: 110,
      name: 'Congressional Stock Ban',
      topIssue: {
        createdAt: 1649095557367,
        updatedAt: 1649095557367,
        id: 26,
        name: 'Economy',
      },
    },
  ],
  'position-110':
    "I believe that public officials should be held to the highest standards of integrity and transparency, and this includes members of Congress. The trust of the public is paramount in maintaining a functional and accountable government.\n\nThat being said, I support the idea of a Congressional Stock Ban. This would entail prohibiting members of Congress from trading individual stocks while in office, to avoid conflicts of interest and even the appearance of impropriety. Instead, they could invest in diversified funds or other investment vehicles that don't create a conflict between their personal financial interests and their duty to serve the public.\n\nAs a city council member, I wouldn't have direct influence over this federal legislation. However, I would advocate for similar measures at the local level to ensure that our elected officials in Aliso Viejo maintain a high level of integrity and transparency. I believe that it is important for those in public office to prioritize the public interest above personal gain, and a stock ban would be a step in the right direction toward achieving that goal.",
  'position-101':
    'I believe that a competitive marketplace is essential for fostering innovation, consumer choice, and economic growth. When monopolies or oligopolies dominate an industry, it can stifle competition and lead to higher prices, reduced quality, and fewer options for consumers.\n\nAs a city council member, my influence on breaking up monopolies at the national or international level would be limited. However, I would work within my capacity to promote fair competition and support local businesses in Aliso Viejo. Encouraging small businesses to thrive and ensuring that they have a level playing field is a vital part of maintaining a healthy local economy.\n\nAt the same time, I understand that collaboration and cooperation can lead to innovation and economies of scale. Therefore, I would advocate for a balanced approach that recognizes the benefits of both competition and collaboration while safeguarding consumer interests and promoting overall economic growth.',
  'position-13':
    "it can be an effective tool to address income inequality and provide additional funding for essential public services. However, it's crucial to implement it in a balanced and thoughtful manner to avoid discouraging entrepreneurship and innovation. When considering a wealth tax, we need to take into account its potential impact on economic growth, job creation, and the overall business environment. My primary focus is on ensuring that our community thrives, and I believe that any tax policy should be evaluated based on its ability to promote fairness, support social programs, and contribute to a healthy economy.",
};

let log = 'starting. ';
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      // fix missing candidate positions for mateo
      const candidate = await Candidate.findOne({ slug: 'matthew-wardenaar' });
      log += `candidate: ${JSON.stringify(candidate)}
      
      `;
      await createCandidatePositions(topIssues, candidate);

      return exits.success({
        message: 'Done',
        log,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        error: JSON.stringify(e),
        log,
      });
    }
  },
};

async function createCandidatePositions(topIssues, candidate) {
  for (let i = 0; i < topIssues.positions.length; i++) {
    log += `in loop ${i}
    `;
    const position = topIssues.positions[i];
    log += `position: ${JSON.stringify(position)}`;

    if (position.id !== 'custom-id') {
      log += `creating candidate posistion with 
        description: ${topIssues[`position-${position.id}`]},
        candidate: ${candidate.id},
        position: ${position.id},
        topIssue: ${position.topIssue.id},
        order: ${i},
      `;
      await CandidatePosition.create({
        description: topIssues[`position-${position.id}`],
        candidate: candidate.id,
        position: position.id,
        topIssue: position.topIssue.id,
        order: i,
      });
      log += `after create
      `;
      await Candidate.addToCollection(candidate.id, 'positions', position.id);
      await Candidate.addToCollection(
        candidate.id,
        'topIssues',
        position.topIssue.id,
      );
      log += `after collection
      `;
    } else {
      const data = JSON.parse(candidate.data);

      const newIssue = {
        description: topIssues[`position-${position.id}`],
      };
      if (!data.customIssues) {
        data.customIssues = [];
      }

      data.customIssues.push(newIssue);

      await Candidate.updateOne({
        id: candidate.id,
      }).set({
        data: JSON.stringify(data),
      });
    }
  }
}
