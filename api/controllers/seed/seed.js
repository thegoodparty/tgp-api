const slugify = require('slugify');

// connect campaigns and candidates
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      const campaignNames = [
        'Randal Wuorinen',
        'Reinaldo Diaz',
        'Que Chandler',
        'Sylvia Sharps',
        'Pk Parekh',
        'Rebecca Mccloud',
        'Lonnie Brown',
        'Kim Herro',
        'Chad Berken',
        'Scott Sell',
        'Megan Gadallah',
        'Jill Wiederholt',
        'David Jensen',
        'Diane Kohm',
        'Christopher Mcvoy',
        'Collin Leary',
        'Donie Le Pinto',
        'Leon Dwiggins',
        'Ladonna Allen',
        'Henry Jim',
        'Mitchell Henderson',
        'Doris Borgelt',
        'Karin Tepley',
        'Mallory Biersack',
        'Todd Cunningham',
        'Shawn Cogan',
        'Liz Beaudoin',
        'Kraig Sr',
        'Jay Hamilton',
        'Lisa Harbeck',
        'Eric Frederickson',
        'Charles Piper',
        'Scott Jacobson',
        'Fred Winchowky',
        'Alex Brower',
        'Debbie Schmidt',
        'Karen Mills',
        'Colleen Brown',
        'Ray Bogdanowski',
        'Joe Plocher',
        'Ronald Digman',
        'Nick Ganser',
        'Lauren Roman',
        'Larry Goldman',
        'Brad Clark',
        'Joshua Rydell',
        'Michael Balles',
        'Terry Martin',
        'Joyce Cappiello',
        'Rick Lazott',
        'Eric Lindroth',
        'Merideth Garcia',
        'Susan Culpepper',
        'Joseph Castelot',
        'Shea Boschee',
        'Adam Miller',
        'Jared Messina',
        'Julaine Aschenbrenner',
        'Laila Volle',
        'Patrick Tschimperle',
        'Alexandra Simocko',
        'Tiffany Ostermeier',
        'Dan Diskey',
        'Guideon Richeson',
        'Tim Searles',
        'James Johnson',
        'Michelle Siudut',
        'Christopher Nicolopoulos',
        'Brian Lenzi',
        'Samuel Henderson',
        'Selena Samios',
        'Dennis Cashman',
      ];
      let count = 0;
      for (let i = 0; i < campaignNames.length; i++) {
        const slug = slugify(campaignNames[i], { lower: true });
        const campaign = await Campaign.findOne({ slug });
        if (campaign) {
          await sails.helpers.crm.updateCampaign(campaign);
          count++;
        }
      }
      return exits.success({
        message: 'updated',
        total: campaignNames.length,
        updated: count,
      });
    } catch (e) {
      console.log('Error in seed', e);
      await sails.helpers.slack.errorLoggerHelper('Error at seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};
