/**
 * deadlines/refresh.js
 *
 * @description :: Update the election deadlines
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const stateAndFedEmail =
  sails.config.custom.stateAndFedEmail || sails.config.stateAndFedEmail;

const stateAndFedPassword =
  sails.config.custom.stateAndFedPassword || sails.config.stateAndFedPassword;

const states = [
  'Federal',
  'Alabama',
  'Alaska',
  'American Samoa',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'District of Columbia',
  'Florida',
  'Georgia',
  'Guam',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Northern Mariana Islands',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Puerto Rico',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'U.S. Virgin Islands',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
];

function validMonth(str = '') {
  return (
    str.includes('Jan') ||
    str.includes('Feb') ||
    str.includes('Mar') ||
    str.includes('Apr') ||
    str.includes('May') ||
    str.includes('Jun') ||
    str.includes('Jul') ||
    str.includes('Aug') ||
    str.includes('Sep') ||
    str.includes('Oct') ||
    str.includes('Nov') ||
    str.includes('Dec')
  );
}

module.exports = {
  friendlyName: 'Refresh election deadlines',
  exits: {
    success: {
      description: 'Ok',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Refresh error.',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const puppeteer = require('puppeteer'); // moved it to here so the app can deploy on aws
      console.log('initializing browser...');
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      await page.goto('https://guidebook.stateandfed.com/login/');

      // Update selector to match the h2 element
      const title = await page.evaluate(() => {
        const titleElement = document.querySelector('h2 > font');
        return titleElement.textContent.trim();
      });

      // Handle cookie consent popup
      try {
        await page.waitForSelector('.t-acceptAllButton', { timeout: 5000 });
        await page.click('.t-acceptAllButton');
        console.log('Clicked on cookie consent button.');
      } catch (e) {
        console.log('Cookie consent button not found or already accepted.');
      }

      await new Promise((resolve) => setTimeout(resolve, 2000)); // Sleeps for 2 seconds

      if (title === 'Login to My Account') {
        console.log('Successfully navigated to login page!');

        // Fill the username and password inputs and submit the form
        await page.type('input[name="login"]', stateAndFedEmail);
        await page.type('input[name="pw"]', stateAndFedPassword);
        await page.click('input[name="submit"]');

        // Wait for the dashboard image to load
        await page.waitForSelector('img[src="../img/dashboard.png"]', {
          timeout: 5000,
        });
        console.log('Successfully logged in!');
      } else {
        console.error('Failed to navigate to the login page!');
      }

      // For each state we visit the state URL and validate the key dates.
      for (const state of states) {
        console.log('Getting state: ', state);
        let url = `https://guidebook.stateandfed.com/exec/?book=political-contributions&state=${state}&jurisdiction=&topic=Key+Dates`;
        await page.goto(url);

        // Update selector to match the h4 element
        const stateTitle = await page.evaluate(() => {
          const titleElement = document.querySelector('h4');
          return titleElement.textContent.trim();
        });
        let year;
        if (stateTitle.includes('Key Dates for ')) {
          console.log('Successfully navigated to the state page!');
          // Extract the numbers using a regex matched group on \d+
          year = stateTitle.match(/\d+/)[0];
          console.log('Year: ', year);
        } else {
          console.log('Failed to navigate to the state page!');
          continue;
        }

        const existingDeadlines = await ElectionDeadlines.find({ state, year });
        if (existingDeadlines && existingDeadlines.length > 0) {
          console.log(
            `Skipping ${state} ${year} because it already exists in the database.`,
          );
          await new Promise((resolve) => setTimeout(resolve, 10000));
          continue;
        }

        // Extract table data
        const tableData = await page.$$eval('table tbody tr', (rows) => {
          return rows.slice(1).map((row) => {
            // slice(1) to skip the header row
            const columns = row.querySelectorAll('td');
            return {
              reportType: columns.length > 0 ? columns[0].innerText : null,
              reportingPeriod: columns.length > 1 ? columns[1].innerText : null,
              dueDate: columns.length > 2 ? columns[2].innerText : null,
            };
          });
        });

        for (const data of tableData) {
          if (
            !data.dueDate ||
            data.dueDate === null ||
            data.reportType === null ||
            data.reportType === 'null'
          ) {
            console.log('Skipping row because it is missing data: ', data);
            continue;
          }
          // format the dueDate.
          let dueDate = data.dueDate;
          dueDate = dueDate.replace(/(\*)/g, '');

          if (data.reportingPeriod === 'Ongoing') {
            dueDate = 'December 31';
          }

          let fullDate;
          let relativeDate;
          // if dueDate does not contain a valid month it is a relative date ie: Within 3 days, Within 24 hours, etc...
          if (!validMonth(dueDate)) {
            relativeDate = dueDate;
            if (data.reportingPeriod && data.reportingPeriod.includes(' to ')) {
              fullDate = data.reportingPeriod.toString().split(' to ')[1];
            } else {
              console.log(
                'Warning! could not find dueDate for: ',
                data.reportType,
                state,
              );
              dueDate = 'December 31';
              fullDate = `${dueDate} ${year}`;
            }
          } else {
            fullDate = `${dueDate} ${year}`;
          }
          if (!fullDate || !fullDate.includes(year)) {
            console.log(
              'error: failed to validate due date for: ',
              data.reportType,
              state,
            );
            continue;
          }
          if (data.reportingPeriod === '') {
            data.reportingPeriod = `Before ${fullDate}`;
          }

          const dateNumber = new Date(fullDate).getTime();
          const shortState = await sails.helpers.zip.longToShortState(state);

          console.log(
            `state: ${state} shortState: ${shortState} year: ${year} reportType: ${data.reportType} reportingPeriod: ${data.reportingPeriod} fullDate: ${fullDate} dateNumber: ${dateNumber}`,
          );
          await ElectionDeadlines.create({
            state: shortState,
            year,
            reportType: data.reportType,
            reportPeriod: data.reportingPeriod,
            dueDate: dateNumber,
            relativeDueDate: relativeDate ? relativeDate : '',
          });
        }

        console.log('sleeping...');
        // Sleep for 10 seconds between each state
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }

      console.log('All done!');

      // Leave the browser open for a bit
      await new Promise((resolve) => setTimeout(resolve, 30000));

      // Close the browser when we're done
      await browser.close();

      return exits.success({
        ok: true,
      });
    } catch (e) {
      console.log('Error in refresh deadlines', e);
      return exits.badRequest();
    }
  },
};
