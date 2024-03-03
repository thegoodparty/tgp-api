// See https://github.com/peopledatalabs/peopledatalabs-js
const PDLJS = require('peopledatalabs');
const { google } = require('googleapis');
const sheets = google.sheets('v4');
const AWS = require('aws-sdk');

const googleServiceEmail =
  'good-party-service@thegoodparty-1562658240463.iam.gserviceaccount.com';

const peopleLabKey =
  sails.config.custom.peopleLabKey || sails.config.peopleLabKey;

const PDLJSClient = new PDLJS({ apiKey: peopleLabKey });

const accessKeyId =
  sails.config.custom.awsAccessKeyId || sails.config.awsAccessKeyId;
const secretAccessKey =
  sails.config.custom.awsSecretAccessKey || sails.config.awsSecretAccessKey;

AWS.config.update({
  region: 'eu-west-2',
  accessKeyId,
  secretAccessKey,
});

const s3Bucket = 'goodparty-keys';
const s3 = new AWS.S3();

const candidates = [
  {
    firstName: 'Barbara',
    lastName: 'Womack Webb',
    City: 'Crittenden',
    State: 'Arkansas',
    email: 'barbarawebb13@gmail.com',
  },
  {
    firstName: 'William (Bill)',
    lastName: 'Croney',
    City: 'St. Ann',
    State: 'Missouri',
    email: 'bcroney@hotmail.com',
  },
  {
    firstName: 'Beatriz',
    lastName: 'Mendoza',
    City: 'Orange',
    State: 'California',
    email: 'beamendoza2020@gmail.com',
  },
  {
    firstName: 'Bodie',
    lastName: 'Golla',
    City: 'Ely',
    State: 'Nevada',
    email: 'bodiegolla@gmail.com',
  },
  {
    firstName: 'Kristy',
    lastName: 'Fields',
    City: 'Robeson County',
    State: 'North Carolina',
    email: 'bornagainlumbee@yahoo.com',
  },
  {
    firstName: 'Brandy',
    lastName: 'Holbrook',
    City: 'Carlin',
    State: 'Nevada',
    email: 'brandyholbrook@citlink.net',
  },
  {
    firstName: 'Brenda Marie',
    lastName: 'Ingram',
    City: 'Fallon',
    State: 'Nevada',
    email: 'brenda@brendaingramforjp.com',
  },
  {
    firstName: 'Brent',
    lastName: 'Eubanks',
    City: 'Little Rock County',
    State: 'Arkansas',
    email: 'brent@electeubanks.com',
  },
  {
    firstName: 'Benjamin D',
    lastName: 'Trotter',
    City: 'Fallon',
    State: 'Nevada',
    email: 'bsakt@outlook.com',
  },
  {
    firstName: 'Aaron M.',
    lastName: 'Bushur',
    City: 'Wells',
    State: 'Nevada',
    email: 'bushurlawgroup@gmail.com',
  },
  {
    firstName: 'Camille Marie',
    lastName: 'Vecchiarelli',
    City: 'Dayton',
    State: 'Nevada',
    email: 'camillevecch@hotmail.com',
  },
  {
    firstName: 'Bryan',
    lastName: 'Sexton',
    City: 'Bentonville',
    State: 'Arkansas',
    email: 'campaign@sextonforprosecutor.com',
  },
  {
    firstName: 'Raeshann',
    lastName: 'Canady',
    City: 'Las Vegas',
    State: 'Nevada',
    email: 'canadyforcourt@gmail.com',
  },
  {
    firstName: 'Candice',
    lastName: 'Hinton',
    City: 'Franklin County',
    State: 'North Carolina',
    email: 'candicehinton2024@gmail.com',
  },
  {
    firstName: 'David',
    lastName: 'Grig',
    City: 'Watauga County',
    State: 'North Carolina',
    email: 'candidategrig@gmail.com',
  },
  {
    firstName: 'Robert E',
    lastName: 'Thomas, Iii',
    City: 'Pahrump',
    State: 'Nevada',
    email: 'carguy341@yahoo.com',
  },
  {
    firstName: 'Cory',
    lastName: 'Coburn',
    City: 'Madison county County',
    State: 'Ohio',
    email: 'ccburn2032@gmail.com',
  },
  {
    firstName: 'Charlotte',
    lastName: 'Lloyd',
    City: 'Watauga County',
    State: 'North Carolina',
    email: 'charlotte4wataugakids@gmail.com',
  },
  {
    firstName: 'Chris',
    lastName: 'King',
    City: 'Madison county County',
    State: 'Ohio',
    email: 'chistopher.aaron.wallace@gmail.com',
  },
  {
    firstName: 'Cindy',
    lastName: 'Taylor',
    City: 'Montgomery County',
    State: 'North Carolina',
    email: 'cindy.taylor@montgomery.k12.nc.us',
  },
  {
    firstName: 'Clara',
    lastName: 'Levers',
    City: 'Yolo',
    State: 'California',
    email: 'claralevers0202@gmail.com',
  },
  {
    firstName: 'Madeline',
    lastName: 'Cline',
    City: 'Mendocino',
    State: 'California',
    email: 'clineforsupervisor@gmail.com',
  },
  {
    firstName: 'Clint',
    lastName: 'McGue',
    City: 'Cabot',
    State: 'Arkansas',
    email: 'clint@cebridge.net',
  },
  {
    firstName: 'Clinton',
    lastName: 'Irons',
    City: 'Jackson County',
    State: 'North Carolina',
    email: 'clintirons2024@gmail.com',
  },
  {
    firstName: 'Crystal',
    lastName: 'Monroe',
    City: 'Robeson County',
    State: 'North Carolina',
    email: 'cmonore427@yahoo.com',
  },
  {
    firstName: 'Corina',
    lastName: 'Herrera-Loera',
    City: 'Santa Clara',
    State: 'California',
    email: 'corinaforsupervisor@gmail.com',
  },
  {
    firstName: 'Cotter Clarkson',
    lastName: 'Conway',
    City: 'Reno',
    State: 'Nevada',
    email: 'cotter@conwayatlaw.com',
  },
  {
    firstName: 'Dale Allen',
    lastName: 'Repp',
    City: 'Laughlin',
    State: 'Nevada',
    email: 'dalerepp24@gmail.com',
  },
  {
    firstName: 'Dale',
    lastName: 'Allen Repp',
    City: 'Clark',
    State: 'Alabama',
    email: 'dalerepp24@gmail.com',
  },
  {
    firstName: 'Dave',
    lastName: 'Butler',
    City: 'Placer',
    State: 'California',
    email: 'dave@butlerforsupervisor.com',
  },
  {
    firstName: 'Jack',
    lastName: 'Davenport',
    City: 'Robeson County',
    State: 'North Carolina',
    email: 'davenport2012@icloud.com',
  },
  {
    firstName: 'David',
    lastName: 'Hensley',
    City: 'Moore County',
    State: 'North Carolina',
    email: 'david@davidhensley.com',
  },
  {
    firstName: 'Gregory',
    lastName: 'Denue',
    City: 'Henderson',
    State: 'Nevada',
    email: 'denuelaw1@gmail.com',
  },
  {
    firstName: 'Gregory',
    lastName: 'Denue',
    City: 'Clark',
    State: 'Alabama',
    email: 'denuelaw1@gmail.com',
  },
  {
    firstName: 'Eileen F',
    lastName: 'Herrington',
    City: 'Virginia City',
    State: 'Nevada',
    email: 'efherrington57@gmail.com',
  },
  {
    firstName: 'Fernando',
    lastName: 'Ansaldo',
    City: 'Monterey',
    State: 'California',
    email: 'electansaldo@gmail.com',
  },
  {
    firstName: 'John',
    lastName: 'Simmons',
    City: 'Robeson County',
    State: 'North Carolina',
    email: 'elord4343@gmail.com',
  },
  {
    firstName: 'Philip',
    lastName: 'Fields',
    City: 'Ventura',
    State: 'California',
    email: 'fields4venturadist1@gmail.com',
  },
  {
    firstName: 'Iphenia R. (Fee Fee)',
    lastName: 'Butler',
    City: 'Pine Lawn',
    State: 'Missouri',
    email: 'frankb563@yahoo.com',
  },
  {
    firstName: 'Gary',
    lastName: 'Thompson',
    City: 'Henderson',
    State: 'Nevada',
    email: 'gary@garythompsonlaw.com',
  },
  {
    firstName: 'Gary',
    lastName: 'Thompson',
    City: 'Clark',
    State: 'Alabama',
    email: 'gary@garythompsonlaw.com',
  },
  {
    firstName: 'Gary',
    lastName: 'Petersen',
    City: 'Nevada',
    State: 'California',
    email: 'garyfornccouncil@gmail.com',
  },
  {
    firstName: 'Regina',
    lastName: 'Mcconnell',
    City: 'Henderson',
    State: 'Nevada',
    email: 'gina4familyjudge@gmail.com',
  },
  {
    firstName: 'Regina',
    lastName: 'McConnell',
    City: 'Clark',
    State: 'Alabama',
    email: 'gina4familyjudge@gmail.com',
  },
  {
    firstName: 'Gino',
    lastName: 'Briscoe',
    City: 'Laughlin',
    State: 'Nevada',
    email: 'ginoforjustice@gmail.com',
  },
  {
    firstName: 'Gino',
    lastName: 'Briscoe',
    City: 'Clark',
    State: 'Alabama',
    email: 'ginoforjustice@gmail.com',
  },
  {
    firstName: 'Donna',
    lastName: 'Harrison',
    City: 'Halifax County',
    State: 'North Carolina',
    email: 'harrisondonnab@gmail.com',
  },
  {
    firstName: 'Amanda',
    lastName: 'Heimbecker',
    City: 'Gates County',
    State: 'North Carolina',
    email: 'heimbeckeraj@gatescountyschools.net',
  },
  {
    firstName: 'Henry',
    lastName: 'Fries',
    City: 'Dane County County',
    State: 'Wisconsin',
    email: 'henryfordistrict5@gmail.com',
  },
  {
    firstName: 'Harvey',
    lastName: 'Gruber',
    City: 'Henderson',
    State: 'Nevada',
    email: 'hgruber@hgruberlaw.com',
  },
  {
    firstName: 'Harvey',
    lastName: 'Gruber',
    City: 'Clark',
    State: 'Alabama',
    email: 'hgruber@hgruberlaw.com',
  },
  {
    firstName: 'Rodney',
    lastName: 'Hunt',
    City: 'Robeson County',
    State: 'North Carolina',
    email: 'huntrodney585@gmail.com',
  },
  {
    firstName: 'Hy',
    lastName: 'Forgeron',
    City: 'Argenta',
    State: 'Nevada',
    email: 'hy4justice@gmail.com',
  },
  {
    firstName: 'Amber',
    lastName: 'Manfree',
    City: 'Napa',
    State: 'California',
    email: 'info@amber4napa.com',
  },
  {
    firstName: 'Brian',
    lastName: 'Colbert',
    City: 'Marin',
    State: 'California',
    email: 'info@colbertforsupervisor.com',
  },
  {
    firstName: 'Fernando',
    lastName: 'Garcia',
    City: 'San Diego',
    State: 'California',
    email: 'info@garciaforsandiego.com',
  },
  {
    firstName: 'Jennifer',
    lastName: 'Esteen',
    City: 'Alameda',
    State: 'California',
    email: 'info@jenniferesteen.com',
  },
  {
    firstName: 'Molly',
    lastName: 'McNulty',
    City: 'Little Rock County',
    State: 'Arkansas',
    email: 'info@mollymcnulty.com',
  },
  {
    firstName: 'Nathalie',
    lastName: 'Mvondo',
    City: 'Yolo',
    State: 'California',
    email: 'info@nj4supervisor.com',
  },
  {
    firstName: 'Larry',
    lastName: 'Turner',
    City: 'San Diego',
    State: 'California',
    email: 'info@turner24.com',
  },
  {
    firstName: 'Iindia',
    lastName: 'Pearson',
    City: 'Buncombe',
    State: 'North Carolina',
    email: 'ipearson2@outlook.com',
  },
  {
    firstName: 'Bruce',
    lastName: 'Jaffe',
    City: 'Santa Clara county',
    State: 'California',
    email: 'jaffeforsupervisor@gmail.com',
  },
  {
    firstName: 'Heller',
    lastName: 'Jason',
    City: 'Wilmington',
    State: 'Delaware',
    email: 'jason.heller@outlook.com',
  },
  {
    firstName: 'Joan',
    lastName: 'Lee',
    City: 'St. Ann',
    State: 'Missouri',
    email: 'jeff.college@aol.com',
  },
  {
    firstName: 'Juanita Regina',
    lastName: 'Martin',
    City: 'Argenta',
    State: 'Nevada',
    email: 'jenmartin7750@gmail.com',
  },
  {
    firstName: 'Jennifer',
    lastName: 'Richards',
    City: 'Reno',
    State: 'Nevada',
    email: 'jennifer@jenn4justice.com',
  },
  {
    firstName: 'Jerome',
    lastName: 'Hunt',
    City: 'Robeson County',
    State: 'North Carolina',
    email: 'jerome.huntad@gmail.com',
  },
  {
    firstName: 'Jill',
    lastName: 'Kamps',
    City: 'Little Rock',
    State: 'Arkansas',
    email: 'jill@jillforjudge.org',
  },
  {
    firstName: 'Jim',
    lastName: 'King',
    City: 'Madison county County',
    State: 'Ohio',
    email: 'jimking36@att.net',
  },
  {
    firstName: 'Jim',
    lastName: "O'Hern",
    City: 'Fort Smith',
    State: 'Arkansas',
    email: 'jimohernlaw@gmail.com',
  },
  {
    firstName: 'Jenni',
    lastName: 'Kiser',
    City: 'Mariposa',
    State: 'California',
    email: 'jkiserdist4sup@gmail.com',
  },
  {
    firstName: 'Jonathan',
    lastName: 'Jones',
    City: 'Gates County',
    State: 'North Carolina',
    email: 'jonesboe2023@gmail.com',
  },
  {
    firstName: 'Janette Reyes',
    lastName: 'Speer',
    City: 'Henderson',
    State: 'Nevada',
    email: 'jreyesspeer@gmail.com',
  },
  {
    firstName: 'Janette',
    lastName: 'Reyes-Speer',
    City: 'Clark',
    State: 'Alabama',
    email: 'jreyesspeer@gmail.com',
  },
  {
    firstName: 'Cheri',
    lastName: 'Simpkins',
    City: 'Upper Marlboro',
    State: 'Maryland',
    email: 'judgecherisimpkins@gmail.com',
  },
  {
    firstName: 'Paul',
    lastName: 'Gaudet',
    City: 'Las Vegas',
    State: 'Nevada',
    email: 'judgegaudet@aol.com',
  },
  {
    firstName: 'Paul',
    lastName: 'Gaudet',
    City: 'Clark',
    State: 'Alabama',
    email: 'judgegaudet@aol.com',
  },
  {
    firstName: 'Gregory',
    lastName: 'J. Kreis',
    City: 'Humboldt',
    State: 'California',
    email: 'judgekreis@yahoo.com',
  },
  {
    firstName: 'Julia',
    lastName: 'Snyder',
    City: 'Ventura',
    State: 'California',
    email: 'julia@juliasnyderforjudge.com',
  },
  {
    firstName: 'Kaylin',
    lastName: 'Boin',
    City: 'Moore County',
    State: 'North Carolina',
    email: 'kaylinboin@gmail.com',
  },
  {
    firstName: 'Kenneth',
    lastName: 'Preston Calton',
    City: 'Wells',
    State: 'Nevada',
    email: 'kcalton@elkocountynv.net',
  },
  {
    firstName: 'Kellie',
    lastName: 'Davis',
    City: 'Moore County',
    State: 'North Carolina',
    email: 'kelliedavisforeducation@gmail.com',
  },
  {
    firstName: 'Kristal',
    lastName: 'Bradford',
    City: 'Las Vegas',
    State: 'Nevada',
    email: 'kristalbradford@gmail.com',
  },
  {
    firstName: 'Kristal',
    lastName: 'Bradford',
    City: 'Clark',
    State: 'Alabama',
    email: 'kristalbradford@gmail.com',
  },
  {
    firstName: 'Kenneth R',
    lastName: 'Quirk',
    City: 'Wendover',
    State: 'Nevada',
    email: 'krq1010@yahoo.com',
  },
  {
    firstName: 'Tracy',
    lastName: 'Larramendy',
    City: 'Hawthorne',
    State: 'Nevada',
    email: 'larramendytracy@yahoo.com',
  },
  {
    firstName: 'Larry Wayne',
    lastName: 'Shupe',
    City: 'Sandy Valley',
    State: 'Nevada',
    email: 'larrywshupe@gmail.com',
  },
  {
    firstName: 'Kyle',
    lastName: 'Leary',
    City: 'Anson County',
    State: 'North Carolina',
    email: 'learyfordistrict1@gmail.com',
  },
  {
    firstName: 'Laura',
    lastName: 'Lee',
    City: 'Warson Woods',
    State: 'Missouri',
    email: 'llee@warsonwoods.com',
  },
  {
    firstName: 'Lori Ann',
    lastName: 'Matheus',
    City: 'Fallon',
    State: 'Nevada',
    email: 'lmatheus@sbcglobal.net',
  },
  {
    firstName: 'Lauren',
    lastName: 'Szafranski',
    City: 'Boulder City',
    State: 'Nevada',
    email: 'lmeudy@gmail.com',
  },
  {
    firstName: 'Lauren',
    lastName: 'Szafranski',
    City: 'Clark',
    State: 'Alabama',
    email: 'lmeudy@gmail.com',
  },
  {
    firstName: 'Laura',
    lastName: 'Rosemore',
    City: 'Hawthorne',
    State: 'Nevada',
    email: 'lrosemore@sbcglobal.net',
  },
  {
    firstName: 'Adam',
    lastName: 'Webb',
    City: 'Chariton',
    State: 'Missouri',
    email: 'lulu8372@yahoo.com',
  },
  {
    firstName: 'Lynn',
    lastName: 'Epps',
    City: 'Montgomery County',
    State: 'North Carolina',
    email: 'lynn.epps@montgomery.k12.nc.us',
  },
];

module.exports = {
  inputs: {},

  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'badRequest',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const jwtClient = await authenticateGoogleServiceAccount();

      await jwtClient.authorize();
      const sheets = google.sheets({ version: 'v4', auth: jwtClient });

      const spreadsheetId = '1RtSsYx4bbVvsNFw9aZxi2GDplcVCTft95bClcuPQPaE';

      // Read rows from the sheet
      const readResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'enhanced', // Adjust based on your sheet's name and range you want to read
      });

      const rows = readResponse.data.values;
      console.log('rows', rows);

      // Create a parameters JSON object
      const updatedRows = [];
      for (let i = 0; i < rows.length; i++) {
        const row = await processRow(rows[i]);
        console.log('processed row', row);
        updatedRows.push(row);
      }

      // Write back to the sheet
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'enhanced',
        valueInputOption: 'RAW',
        requestBody: {
          values: updatedRows,
        },
      });

      return exits.success({
        updatedRows,
      });
    } catch (e) {
      return exits.badRequest({
        message: 'unknown error',
        e,
      });
    }
  },
};

async function authenticateGoogleServiceAccount() {
  const googleServiceJSON = await readJsonFromS3(
    s3Bucket,
    'google-service-key.json',
  );
  const googleServiceKey = googleServiceJSON.private_key;
  // Configure a JWT client with service account
  const jwtClient = new google.auth.JWT(
    googleServiceEmail,
    null,
    googleServiceKey,
    ['https://www.googleapis.com/auth/spreadsheets'],
  );
  return jwtClient;
}

async function readJsonFromS3(bucketName, keyName) {
  try {
    const params = {
      Bucket: bucketName,
      Key: keyName,
    };
    const data = await s3.getObject(params).promise();
    const jsonContent = JSON.parse(data.Body.toString());
    return jsonContent;
  } catch (error) {
    console.log('Error reading JSON from S3:', error);
    throw error;
  }
}

async function processRow(candidate) {
  try {
    if (!candidate) {
      return [];
    }
    if (candidate.length > 5) {
      // already processed
      console.log('already processed', candidate.length);
      return candidate;
    }
    const firstName = candidate[0];
    const lastName = candidate[1];
    const city = candidate[2];
    const state = candidate[3];
    const email = candidate[4];
    console.log('procsessing row : ', firstName, lastName);

    const params = {
      name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
      location: `${city}, ${state}`,
      region: state,
      country: 'United States',
      email,
      min_likelihood: 6,
      // pretty: true,
    };
    console.log('params to send', params);

    // Pass the parameters object to the Person Enrichment API
    const jsonResponse = await PDLJSClient.person.enrichment(params);

    // Print the API response in JSON format
    console.log(jsonResponse);
    return [
      ...candidate,
      jsonResponse?.data?.phone_numbers
        ? JSON.stringify(jsonResponse?.data?.phone_numbers)
        : 'n/a',
      JSON.stringify(jsonResponse?.data),
    ];
  } catch (e) {
    console.log('error processing row : ', candidate);
    console.log('error : ', e);
    return [...candidate, 'n/a', 'n/a'];
  }
}
