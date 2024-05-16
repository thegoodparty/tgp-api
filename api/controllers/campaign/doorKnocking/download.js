module.exports = {
  description: 'Download a CSV file containing all survery results.',

  inputs: {
    slug: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    success: {
      description: 'The CSV was generated and sent successfully.',
    },
    serverError: {
      description: 'There was a problem on the server.',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const user = this.req.user;
      const { slug } = inputs;

      const campaign = await sails.helpers.campaign.byUser(user);
      if (!campaign) {
        return exits.badRequest('No campaign');
      }
      const dkCampaign = await DoorKnockingCampaign.findOne({
        slug,
        campaign: campaign.id,
      }).populate('surveys');

      if (!dkCampaign) {
        return exits.badRequest('No campaign');
      }

      const volunteers = await CampaignVolunteer.find({
        campaign: campaign.id,
      }).populate('user');
      // convert volunteers to an object for easy lookup by user id
      const volunteersObj = {};
      volunteers.forEach((volunteer) => {
        volunteersObj[volunteer.id] = volunteer.user;
      });

      // Convert the records to CSV format
      let csvContent = '';
      const type = dkCampaign.data.type;
      if (type === 'Education Canvas') {
        // add all possible headers
        csvContent +=
          'Why it is harder for independents to get elected?,What is the most important issue?,Would you be interested in helping more independent candidates win?,Resolution,Final Note,Status,Skipped - at home,Skipped - note,Volunteer\n'; // CSV header

        dkCampaign.surveys.forEach((survey) => {
          const {
            harderForIndependents,
            importantIssue,
            helpIndependents,
            resolution,
            note,
            status,
            atHome,
            skipNote,
          } = survey.data || {};
          const volunteer = volunteersObj[survey.volunteer];
          csvContent += `${cleanCsvStr(harderForIndependents)},${cleanCsvStr(
            importantIssue,
          )},${cleanCsvStr(helpIndependents)},${resolution || ''},${cleanCsvStr(
            note,
          )},${status || ''},${atHome || ''},${cleanCsvStr(skipNote)},${
            volunteer.firstName
          } ${volunteer.lastName}\n`;
        });
      }

      if (type === 'Voter Issues/Candidate Issue Awareness') {
        csvContent +=
          'Are you planning to vote in the upcoming election?,Have you ever heard of the candidate?,What issues do you care about?,How likely are you to vote for us?,What are your political views?,Resolution,Final Note,Status,Skipped - at home,Skipped - note,Volunteer\n'; // CSV header

        dkCampaign.surveys.forEach((survey) => {
          const {
            planningToVote,
            heardOf,
            issuesCareAbout,
            voteLikelihood,
            politicalViews,
            resolution,
            note,
            status,
            atHome,
            skipNote,
          } = survey.data || {};
          const volunteer = volunteersObj[survey.volunteer];
          csvContent += `${cleanCsvStr(planningToVote)},${cleanCsvStr(
            heardOf,
          )},${cleanCsvStr(issuesCareAbout)},${cleanCsvStr(
            voteLikelihood,
          )},${cleanCsvStr(politicalViews)},${resolution || ''},${cleanCsvStr(
            note,
          )},${status || ''},${atHome || ''},${cleanCsvStr(skipNote)},${
            volunteer.firstName
          } ${volunteer.lastName}\n`;
        });
      }

      if (type === 'Get Out The Vote') {
        csvContent +=
          'Are you planning to vote in the upcoming election?,Has the voter already voted?,Do you need a ride to the polling station?,How likely are you to vote for us?,Resolution,Final Note,Status,Skipped - at home,Skipped - note,Volunteer\n'; // CSV header

        dkCampaign.surveys.forEach((survey) => {
          const {
            planningToVote,
            alreadyVoted,
            needRide,
            voteLikelihood,
            resolution,
            note,
            status,
            atHome,
            skipNote,
          } = survey.data || {};
          const volunteer = volunteersObj[survey.volunteer];
          csvContent += `${cleanCsvStr(planningToVote)},${cleanCsvStr(
            alreadyVoted,
          )},${cleanCsvStr(needRide)},${cleanCsvStr(voteLikelihood)},${
            resolution || ''
          },${cleanCsvStr(note)},${status || ''},${atHome || ''},${cleanCsvStr(
            skipNote,
          )},${volunteer.firstName} ${volunteer.lastName}\n`;
        });
      }

      if (type === 'Candidate Awareness') {
        csvContent +=
          'What issues do you care about?,Has the voter already voted?,Have you ever heard of the candidate?,How likely are you to vote for us?,Can we follow up with you?,Resolution,Final Note,Status,Skipped - at home,Skipped - note,Volunteer\n'; // CSV header

        dkCampaign.surveys.forEach((survey) => {
          const {
            issues,
            heardOf,
            needRide,
            voteLikelihood,
            canFollow,
            resolution,
            note,
            status,
            atHome,
            skipNote,
          } = survey.data || {};
          const volunteer = volunteersObj[survey.volunteer];
          csvContent += `${cleanCsvStr(issues)},${cleanCsvStr(
            heardOf,
          )},${cleanCsvStr(needRide)},${cleanCsvStr(
            voteLikelihood,
          )},${cleanCsvStr(canFollow)},${resolution || ''},${cleanCsvStr(
            note,
          )},${status || ''},${atHome || ''},${cleanCsvStr(skipNote)},${
            volunteer.firstName
          } ${volunteer.lastName}\n`;
        });
      }

      // Set the headers to instruct the browser to download the file
      this.res.set(
        'Content-Disposition',
        'attachment; filename="door-knocking.csv"',
      );
      this.res.set('Content-Type', 'text/csv');

      return exits.success(csvContent);
    } catch (error) {
      console.log('error at downloadCsv', error);
      return exits.serverError(err);
    }
  },
};

function cleanCsvStr(str) {
  if (!str) {
    return '';
  }
  return str.replace(/,/g, ';');
}
