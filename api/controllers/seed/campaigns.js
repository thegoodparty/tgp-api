const { buildSlug } = require('../../utils/campaign/findSlug');

const DEFAULT_USER_COUNT = 100;
const BATCH_SIZE = 20;

const PARTIES = [
  'independent',
  'forward',
  'green',
  'libertarian',
  'nonpartisan',
];
const LEVELS = ['LOCAL', 'CITY', 'COUNTY', 'STATE', 'FEDERAL'];

module.exports = {
  inputs: {
    count: {
      type: 'number',
    },
  },

  exits: {
    success: {
      description: 'OK',
      responseType: 'ok',
    },
    error: {
      description: 'Error',
      responseType: 'serverError',
    },
    badRequest: {
      description: 'Bad request',
      responseType: 'badRequest',
    },
  },

  async fn(inputs, exits) {
    try {
      const userCount = inputs.count || DEFAULT_USER_COUNT;
      const promises = new Array(BATCH_SIZE);
      const batches = Math.ceil(userCount / BATCH_SIZE);

      console.log(
        `Seeding ${userCount} users + campaigns in ${batches} batches`,
      );

      for (let batch = 0; batch < batches; batch++) {
        const startIndex = batch * BATCH_SIZE;
        const endIndex = startIndex + BATCH_SIZE;
        console.log(`Starting batch ${batch} (${startIndex}-${endIndex - 1})`);

        for (let i = startIndex; i < endIndex && i < userCount; i++) {
          const email = `testing${i}@testperson.com`;
          const state = getStateByIndex(i);
          const location =
            state.locations[Math.floor(Math.random() * state.locations.length)];

          promises[i % BATCH_SIZE] = User.findOrCreate(
            {
              email,
            },
            {
              firstName: `Tester${i}`,
              lastName: 'Testperson',
              name: `Tester${i} Testperson`,
              email,
              password: `Testing${i}`,
              phone: '1234567890',
              zip: location.zip,
              hasPassword: true,
            },
          ).then((user) => {
            process.stdout.write('.');
            const slug = buildSlug(user.name);

            const party = PARTIES[Math.floor(Math.random() * PARTIES.length)];
            const level = LEVELS[Math.floor(Math.random() * LEVELS.length)];

            return Campaign.findOrCreate(
              { slug },
              {
                slug,
                data: {
                  slug,
                  currentStep: 'onboarding-complete',
                },
                isDemo: false,
                isActive: true,
                didWin: i > userCount / 2 ? Math.random() < 0.5 : undefined,
                isPro: i % 2 === 0,
                user: user.id,
                details: {
                  zip: location.zip,
                  pledged: true,
                  party,
                  geoLocation: { ...location },
                  state: state.key,
                  office: 'Other',
                  otherOffice: `${
                    state.key
                  } ${level.toLowerCase()} Representative`,
                  level,
                  ballotLevel: level,
                  hasPrimary: false,
                  electionDate: '2024-11-05',
                  filingPeriodsStart: '2024-02-09',
                  filingPeriodsEnd: '2024-05-09',
                  officeTermLength: 4,
                  partisanType: 'partisan',
                  electionType: 'State House District',
                  electionLocation: state.key + '##001',
                  // TODO: mock these?
                  positionId: '',
                  electionId: '',
                  raceId: '',
                },
              },
            ).then(() => {
              process.stdout.write('.');
            });
          });
        }

        await Promise.all(promises);
      }

      return exits.success();
    } catch (e) {
      console.log('Error in seeding users/campaigns', e);

      return exits.error({
        message: 'Error in seeding users/campaigns',
        error: JSON.stringify(e),
      });
    }
  },
};

function getStateByIndex(index) {
  const STATES = [
    {
      key: 'WI',
      locations: [
        {
          lat: 44.481826548767835,
          lng: -89.51535632567386,
          geohash: 'dpbm51',
          zip: '53703',
        },
        {
          lat: 44.49097607935434,
          lng: -89.31226333304093,
          geohash: 'dpbmpe',
          zip: '53703',
        },
        {
          lat: 44.5155769771765,
          lng: -89.50023635784386,
          geohash: 'dpbm5r',
          zip: '53703',
        },
        {
          lat: 44.33586296382448,
          lng: -89.49869699490434,
          geohash: 'dpbk5r',
          zip: '53703',
        },
        {
          lat: 44.483465316094694,
          lng: -89.62703435343082,
          geohash: 'dpbm03',
          zip: '53703',
        },
      ],
    },
    {
      key: 'WV',
      locations: [
        {
          lat: 38.83521233015911,
          lng: -80.56094821605552,
          geohash: 'dnysyv',
          zip: '25301',
        },
        {
          lat: 38.923370865162546,
          lng: -80.69653883998377,
          geohash: 'dnyt7t',
          zip: '25301',
        },
        {
          lat: 39.12895843367325,
          lng: -80.33846136399019,
          geohash: 'dnyyeg',
          zip: '25301',
        },
        {
          lat: 39.1389307836896,
          lng: -80.34940660158283,
          geohash: 'dnyyet',
          zip: '25301',
        },
        {
          lat: 39.006676774651005,
          lng: -80.68776724724242,
          geohash: 'dnytgu',
          zip: '25301',
        },
      ],
    },
    {
      key: 'VT',
      locations: [
        {
          lat: 44.16685100117098,
          lng: -72.71917106277273,
          geohash: 'dru730',
          zip: '05601',
        },
        {
          lat: 43.850217873296195,
          lng: -72.84590648011711,
          geohash: 'dru1qq',
          zip: '05601',
        },
        {
          lat: 43.80310244758873,
          lng: -72.6259429143295,
          geohash: 'dru35q',
          zip: '05601',
        },
        {
          lat: 43.88968539887694,
          lng: -72.81844650709176,
          geohash: 'dru1wv',
          zip: '05601',
        },
        {
          lat: 44.095103129133236,
          lng: -72.52580264292804,
          geohash: 'dru6ve',
          zip: '05601',
        },
      ],
    },
    {
      key: 'TX',
      locations: [
        {
          lat: 30.860644301495235,
          lng: -99.89664895018477,
          geohash: '9v2zwf',
          zip: '78701',
        },
        {
          lat: 30.871148030708675,
          lng: -99.9747832543251,
          geohash: '9v2zt5',
          zip: '78701',
        },
        {
          lat: 31.13574171471245,
          lng: -100.12487592774866,
          geohash: '9v8c1s',
          zip: '78701',
        },
        {
          lat: 30.927090644915392,
          lng: -100.08596729390773,
          geohash: '9v2zfq',
          zip: '78701',
        },
        {
          lat: 31.139141867657788,
          lng: -99.90617073640193,
          geohash: '9v8cns',
          zip: '78701',
        },
      ],
    },
    {
      key: 'SD',
      locations: [
        {
          lat: 44.48481868755842,
          lng: -99.93203969537635,
          geohash: '9zbvjf',
          zip: '57501',
        },
        {
          lat: 44.68071967016469,
          lng: -99.87962278078892,
          geohash: '9zbypj',
          zip: '57501',
        },
        {
          lat: 44.387323300476865,
          lng: -99.99593746665624,
          geohash: '9zbus8',
          zip: '57501',
        },
        {
          lat: 44.66710358049413,
          lng: -99.87074072232753,
          geohash: '9zbyp7',
          zip: '57501',
        },
        {
          lat: 44.4622018867416,
          lng: -100.04441054011119,
          geohash: '9zbugq',
          zip: '57501',
        },
      ],
    },
    {
      key: 'RI',
      locations: [
        {
          lat: 41.941151490688874,
          lng: -71.67737903766813,
          geohash: 'drmn8g',
          zip: '02901',
        },
        {
          lat: 41.611480240510055,
          lng: -71.67175217716436,
          geohash: 'drmh9p',
          zip: '02901',
        },
        {
          lat: 41.92762331898851,
          lng: -71.83088891393056,
          geohash: 'drkyt2',
          zip: '02901',
        },
        {
          lat: 41.6764886048232,
          lng: -71.63646143035992,
          geohash: 'drmj1f',
          zip: '02901',
        },
        {
          lat: 41.65417139870059,
          lng: -71.74516358999202,
          geohash: 'drkuzq',
          zip: '02901',
        },
      ],
    },
    {
      key: 'OR',
      locations: [
        {
          lat: 43.95844856600804,
          lng: -120.41927185530666,
          geohash: '9rf65f',
          zip: '97301',
        },
        {
          lat: 44.05002755554322,
          lng: -120.50743632919591,
          geohash: '9rf69g',
          zip: '97301',
        },
        {
          lat: 44.029317742459774,
          lng: -120.35013808620317,
          geohash: '9rf6mr',
          zip: '97301',
        },
        {
          lat: 43.88197725876977,
          lng: -120.3281436300609,
          geohash: '9rf3tu',
          zip: '97301',
        },
        {
          lat: 44.07391656796864,
          lng: -120.4746197494754,
          geohash: '9rf6dx',
          zip: '97301',
        },
      ],
    },
    {
      key: 'NY',
      locations: [
        {
          lat: 43.124857241508025,
          lng: -74.99076469807629,
          geohash: 'drdtmd',
          zip: '12207',
        },
        {
          lat: 43.082126361766846,
          lng: -74.94103742088475,
          geohash: 'drdtnd',
          zip: '12207',
        },
        {
          lat: 43.14685087947548,
          lng: -74.87515405270369,
          geohash: 'drdv2n',
          zip: '12207',
        },
        {
          lat: 42.88670895949119,
          lng: -74.80412616859232,
          geohash: 'drdgcz',
          zip: '12207',
        },
        {
          lat: 42.89262833298223,
          lng: -74.85837967172009,
          geohash: 'drdu08',
          zip: '12207',
        },
      ],
    },
    {
      key: 'NH',
      locations: [
        {
          lat: 44.15039509381103,
          lng: -71.66858868625674,
          geohash: 'drv51j',
          zip: '03301',
        },
        {
          lat: 44.070706571034194,
          lng: -71.48592256771575,
          geohash: 'drv4tq',
          zip: '03301',
        },
        {
          lat: 44.02016961533931,
          lng: -71.4091291514602,
          geohash: 'drv4rj',
          zip: '03301',
        },
        {
          lat: 44.02263761836465,
          lng: -71.54164865404906,
          geohash: 'drv4kn',
          zip: '03301',
        },
        {
          lat: 43.82646667316134,
          lng: -71.66682039217466,
          geohash: 'drv134',
          zip: '03301',
        },
      ],
    },
    {
      key: 'NE',
      locations: [
        {
          lat: 41.394414799033036,
          lng: -100.10097145508007,
          geohash: '9z2g6p',
          zip: '68501',
        },
        {
          lat: 41.427884985924464,
          lng: -99.95295008521872,
          geohash: '9z2gtt',
          zip: '68501',
        },
        {
          lat: 41.41067293498461,
          lng: -100.01323193559482,
          geohash: '9z2gs4',
          zip: '68501',
        },
        {
          lat: 41.683061721788455,
          lng: -99.87686863880381,
          geohash: '9z2vph',
          zip: '68501',
        },
        {
          lat: 41.40537732497049,
          lng: -99.86494496202954,
          geohash: '9z2gx9',
          zip: '68501',
        },
      ],
    },
    {
      key: 'KS',
      locations: [
        {
          lat: 38.3825340128264,
          lng: -98.0236205477543,
          geohash: '9yf637',
          zip: '66601',
        },
        {
          lat: 38.696538090743715,
          lng: -97.85324533454904,
          geohash: '9yfkjk',
          zip: '66601',
        },
        {
          lat: 38.67273433697767,
          lng: -98.16076092748146,
          geohash: '9yfhn2',
          zip: '66601',
        },
        {
          lat: 38.56899846540103,
          lng: -98.16372797092473,
          geohash: '9yf5qj',
          zip: '66601',
        },
        {
          lat: 38.42849341074256,
          lng: -98.17434747231475,
          geohash: '9yf4tg',
          zip: '66601',
        },
      ],
    },
    {
      key: 'MS',
      locations: [
        {
          lat: 33.05568362993717,
          lng: -90.17709478282495,
          geohash: '9vzu5c',
          zip: '39201',
        },
        {
          lat: 32.82447129276809,
          lng: -90.04388460106564,
          geohash: '9vzfxp',
          zip: '39201',
        },
        {
          lat: 33.114131032936456,
          lng: -90.06427949967683,
          geohash: '9vzuqs',
          zip: '39201',
        },
        {
          lat: 33.08939338697289,
          lng: -89.97526261127838,
          geohash: 'djbh0x',
          zip: '39201',
        },
        {
          lat: 32.824162394419446,
          lng: -89.99795337511048,
          geohash: 'djb48p',
          zip: '39201',
        },
      ],
    },
    {
      key: 'IL',
      locations: [
        {
          lat: 40.0491952400042,
          lng: -89.14159140752483,
          geohash: 'dp0egd',
          zip: '62701',
        },
        {
          lat: 40.105060412493344,
          lng: -89.0911812199198,
          geohash: 'dp0shs',
          zip: '62701',
        },
        {
          lat: 39.923811550275836,
          lng: -89.05704784576473,
          geohash: 'dp0ej7',
          zip: '62701',
        },
        {
          lat: 39.96996487786481,
          lng: -88.89011941414921,
          geohash: 'dp0g3k',
          zip: '62701',
        },
        {
          lat: 40.196510380210825,
          lng: -88.89585477887452,
          geohash: 'dp0u9j',
          zip: '62701',
        },
      ],
    },
    {
      key: 'DE',
      locations: [
        {
          lat: 39.00849334577023,
          lng: -75.50906451297033,
          geohash: 'dqfmct',
          zip: '19901',
        },
        {
          lat: 39.137851988340124,
          lng: -75.69628418423474,
          geohash: 'dqfntk',
          zip: '19901',
        },
        {
          lat: 38.80842312206991,
          lng: -75.39565618114968,
          geohash: 'dqfku2',
          zip: '19901',
        },
        {
          lat: 38.916635206078666,
          lng: -75.56482034638209,
          geohash: 'dqfm2k',
          zip: '19901',
        },
        {
          lat: 39.15946680420742,
          lng: -75.55326808949995,
          geohash: 'dqfqb8',
          zip: '19901',
        },
      ],
    },
    {
      key: 'CT',
      locations: [
        {
          lat: 41.70982207847525,
          lng: -72.58024113229172,
          geohash: 'drkmk3',
          zip: '06101',
        },
        {
          lat: 41.43232775423013,
          lng: -72.63407697747068,
          geohash: 'drk7en',
          zip: '06101',
        },
        {
          lat: 41.49093552044962,
          lng: -72.81139059443524,
          geohash: 'drkhp1',
          zip: '06101',
        },
        {
          lat: 41.770217045828396,
          lng: -72.5539452616937,
          geohash: 'drkmsu',
          zip: '06101',
        },
        {
          lat: 41.53892054830842,
          lng: -72.63457688801154,
          geohash: 'drkk71',
          zip: '06101',
        },
      ],
    },
    {
      key: 'AR',
      locations: [
        {
          lat: 34.62664906645774,
          lng: -92.12261427220614,
          geohash: '9ynkzx',
          zip: '72201',
        },
        {
          lat: 34.876363976841034,
          lng: -92.28684681370368,
          geohash: '9ynq7v',
          zip: '72201',
        },
        {
          lat: 34.642268509454354,
          lng: -92.12976737823642,
          geohash: '9ynmpd',
          zip: '72201',
        },
        {
          lat: 34.8440157971366,
          lng: -92.18350589739038,
          geohash: '9ynqnr',
          zip: '72201',
        },
        {
          lat: 34.68444665606433,
          lng: -92.08006612293855,
          geohash: '9ynt2d',
          zip: '72201',
        },
      ],
    },
    {
      key: 'IN',
      locations: [
        {
          lat: 40.2446569718427,
          lng: -86.23713637927541,
          geohash: 'dp4svw',
          zip: '46201',
        },
        {
          lat: 40.361249428128495,
          lng: -86.12543320982836,
          geohash: 'dp4v85',
          zip: '46201',
        },
        {
          lat: 40.22662240437085,
          lng: -86.16395666780349,
          geohash: 'dp4sz7',
          zip: '46201',
        },
        {
          lat: 40.34940568674227,
          lng: -86.12127564928994,
          geohash: 'dp4v83',
          zip: '46201',
        },
        {
          lat: 40.43204818734027,
          lng: -86.21388474423675,
          geohash: 'dp4wn0',
          zip: '46201',
        },
      ],
    },
    {
      key: 'MO',
      locations: [
        {
          lat: 38.394236119211726,
          lng: -92.74171713458107,
          geohash: '9yy43t',
          zip: '65101',
        },
        {
          lat: 38.556802351547944,
          lng: -92.64656347770509,
          geohash: '9yy57g',
          zip: '65101',
        },
        {
          lat: 38.58380908247444,
          lng: -92.73616061216696,
          geohash: '9yy53x',
          zip: '65101',
        },
        {
          lat: 38.538428503303,
          lng: -92.61576921632218,
          geohash: '9yy5hr',
          zip: '65101',
        },
        {
          lat: 38.39373622331944,
          lng: -92.60519864445958,
          geohash: '9yy4kt',
          zip: '65101',
        },
      ],
    },
    {
      key: 'FL',
      locations: [
        {
          lat: 27.848279659042174,
          lng: -81.57996280294653,
          geohash: 'dhvyrt',
          zip: '32301',
        },
        {
          lat: 27.902646052394292,
          lng: -81.76868585725289,
          geohash: 'dhvyer',
          zip: '32301',
        },
        {
          lat: 28.081416528694476,
          lng: -81.73418559219878,
          geohash: 'dhvzu0',
          zip: '32301',
        },
        {
          lat: 28.125411028917725,
          lng: -81.82853333866508,
          geohash: 'djjb1b',
          zip: '32301',
        },
        {
          lat: 27.953443916282914,
          lng: -81.8565186075543,
          geohash: 'dhvz12',
          zip: '32301',
        },
      ],
    },
    {
      key: 'NV',
      locations: [
        {
          lat: 39.71641741494308,
          lng: -117.08426165094242,
          geohash: '9rh9zw',
          zip: '89701',
        },
        {
          lat: 39.788560573895396,
          lng: -117.40227880005826,
          geohash: '9rhd27',
          zip: '89701',
        },
        {
          lat: 39.886278095582426,
          lng: -117.3374618107629,
          geohash: '9rhdcv',
          zip: '89701',
        },
        {
          lat: 39.77615890949126,
          lng: -117.36104636240498,
          geohash: '9rhd33',
          zip: '89701',
        },
        {
          lat: 39.8400610772704,
          lng: -117.0558262181068,
          geohash: '9rhf8k',
          zip: '89701',
        },
      ],
    },
    {
      key: 'ME',
      locations: [
        {
          lat: 45.35933269958734,
          lng: -69.06746545794647,
          geohash: 'f2nfh3',
          zip: '04330',
        },
        {
          lat: 45.405205633409544,
          lng: -69.07021411985477,
          geohash: 'f2nfk3',
          zip: '04330',
        },
        {
          lat: 45.34073539343122,
          lng: -69.08733849998882,
          geohash: 'f2ncgy',
          zip: '04330',
        },
        {
          lat: 45.44517429650359,
          lng: -68.7727561681817,
          geohash: 'f2p4e1',
          zip: '04330',
        },
        {
          lat: 45.19112587886681,
          lng: -68.98707270611705,
          geohash: 'f2ncn4',
          zip: '04330',
        },
      ],
    },
    {
      key: 'MI',
      locations: [
        {
          lat: 44.34946470785235,
          lng: -84.601896031073,
          geohash: 'dpgu6c',
          zip: '48911',
        },
        {
          lat: 44.16301583012231,
          lng: -84.66495294438538,
          geohash: 'dpgg1r',
          zip: '48911',
        },
        {
          lat: 44.15945102601528,
          lng: -84.69019002821783,
          geohash: 'dpgg0y',
          zip: '48911',
        },
        {
          lat: 44.05025433634575,
          lng: -84.66477636676262,
          geohash: 'dpgf97',
          zip: '48911',
        },
        {
          lat: 44.19428276204541,
          lng: -84.61543036109721,
          geohash: 'dpgg6t',
          zip: '48911',
        },
      ],
    },
    {
      key: 'GA',
      locations: [
        {
          lat: 33.2610525469556,
          lng: -83.61725649617576,
          geohash: 'djut1n',
          zip: '30301',
        },
        {
          lat: 33.38913450495372,
          lng: -83.31426202447494,
          geohash: 'djuvbn',
          zip: '30301',
        },
        {
          lat: 33.29701334803654,
          lng: -83.58679058503294,
          geohash: 'djut3v',
          zip: '30301',
        },
        {
          lat: 33.12196244895791,
          lng: -83.36661804775757,
          geohash: 'djusqv',
          zip: '30301',
        },
        {
          lat: 33.263875931555,
          lng: -83.43648475555464,
          geohash: 'djutjr',
          zip: '30301',
        },
      ],
    },
    {
      key: 'HI',
      locations: [
        {
          lat: 19.92393645717313,
          lng: -155.84743716685267,
          geohash: '8e91me',
          zip: '96801',
        },
        {
          lat: 19.55005360063386,
          lng: -155.9717511407517,
          geohash: '8e3p4y',
          zip: '96801',
        },
        {
          lat: 19.565020956263716,
          lng: -155.8606300383248,
          geohash: '8e3pm3',
          zip: '96801',
        },
        {
          lat: 19.89414037423974,
          lng: -155.7145239030085,
          geohash: '8e930t',
          zip: '96801',
        },
        {
          lat: 19.636685812306045,
          lng: -155.8589111407555,
          geohash: '8e3ptq',
          zip: '96801',
        },
      ],
    },
    {
      key: 'AK',
      locations: [
        {
          lat: 66.09186526230255,
          lng: -153.29613916683007,
          geohash: 'bedzzx',
          zip: '99801',
        },
        {
          lat: 66.15526103725428,
          lng: -153.42549228666326,
          geohash: 'befbke',
          zip: '99801',
        },
        {
          lat: 65.99699666223776,
          lng: -153.3441885547338,
          geohash: 'bedzqw',
          zip: '99801',
        },
        {
          lat: 66.0584572787982,
          lng: -153.5097250413535,
          geohash: 'bedzfc',
          zip: '99801',
        },
        {
          lat: 66.04625054485525,
          lng: -153.20317630039654,
          geohash: 'beep9z',
          zip: '99801',
        },
      ],
    },
    {
      key: 'TN',
      locations: [
        {
          lat: 35.98652917189866,
          lng: -86.46522654602701,
          geohash: 'dn6s8r',
          zip: '37201',
        },
        {
          lat: 35.70663917938084,
          lng: -86.79123565949929,
          geohash: 'dn671h',
          zip: '37201',
        },
        {
          lat: 35.98287340915719,
          lng: -86.541560437351,
          geohash: 'dn6kww',
          zip: '37201',
        },
        {
          lat: 35.66187685680909,
          lng: -86.69259457764186,
          geohash: 'dn66gk',
          zip: '37201',
        },
        {
          lat: 35.99406114066814,
          lng: -86.73227064511815,
          geohash: 'dn6kf2',
          zip: '37201',
        },
      ],
    },
    {
      key: 'VA',
      locations: [
        {
          lat: 38.02683535937539,
          lng: -78.15880464786257,
          geohash: 'dqb2m6',
          zip: '23218',
        },
        {
          lat: 37.85985780038466,
          lng: -78.16327521128741,
          geohash: 'dq8rmk',
          zip: '23218',
        },
        {
          lat: 38.058187874296216,
          lng: -77.92560011934282,
          geohash: 'dqb8db',
          zip: '23218',
        },
        {
          lat: 37.852828500764225,
          lng: -77.87954841031981,
          geohash: 'dq8x7f',
          zip: '23218',
        },
        {
          lat: 37.96197905433171,
          lng: -78.05739983764586,
          geohash: 'dq8rzy',
          zip: '23218',
        },
      ],
    },
    {
      key: 'NJ',
      locations: [
        {
          lat: 39.904647306185815,
          lng: -74.75182325195118,
          geohash: 'dr4g4b',
          zip: '08608',
        },
        {
          lat: 39.663973760272945,
          lng: -74.90615111498461,
          geohash: 'dr49xk',
          zip: '08608',
        },
        {
          lat: 39.70747661380749,
          lng: -74.89482411543746,
          geohash: 'dr49zs',
          zip: '08608',
        },
        {
          lat: 39.650993127727595,
          lng: -74.77443251639914,
          geohash: 'dr4cd6',
          zip: '08608',
        },
        {
          lat: 39.968371575215016,
          lng: -74.87857291903889,
          geohash: 'dr4g2h',
          zip: '08608',
        },
      ],
    },
    {
      key: 'KY',
      locations: [
        {
          lat: 37.84360467781212,
          lng: -84.43629170093561,
          geohash: 'dnezq9',
          zip: '40601',
        },
        {
          lat: 37.98019759248896,
          lng: -84.14411145623586,
          geohash: 'dnu0j6',
          zip: '40601',
        },
        {
          lat: 37.87627739224465,
          lng: -84.22114136300176,
          geohash: 'dnsp7x',
          zip: '40601',
        },
        {
          lat: 37.760465856262584,
          lng: -84.08397474036363,
          geohash: 'dnsnyd',
          zip: '40601',
        },
        {
          lat: 37.72399136689187,
          lng: -84.32026212742862,
          geohash: 'dnsn95',
          zip: '40601',
        },
      ],
    },
    {
      key: 'ND',
      locations: [
        {
          lat: 47.56361008303012,
          lng: -100.4928445969998,
          geohash: 'cb2w94',
          zip: '58501',
        },
        {
          lat: 47.47912334100265,
          lng: -100.629886348572,
          geohash: 'cb2qn5',
          zip: '58501',
        },
        {
          lat: 47.461975207132525,
          lng: -100.50894196344854,
          geohash: 'cb2w0b',
          zip: '58501',
        },
        {
          lat: 47.74808758812885,
          lng: -100.46546781170619,
          geohash: 'cb2x9u',
          zip: '58501',
        },
        {
          lat: 47.603438945679365,
          lng: -100.47040677407834,
          geohash: 'cb2wc9',
          zip: '58501',
        },
      ],
    },
    {
      key: 'MN',
      locations: [
        {
          lat: 46.23615830780024,
          lng: -94.51243160443592,
          geohash: 'cbhz13',
          zip: '55101',
        },
        {
          lat: 46.32511611980541,
          lng: -94.45520405205494,
          geohash: 'cbhzd9',
          zip: '55101',
        },
        {
          lat: 46.59066236650531,
          lng: -94.67828635814931,
          geohash: 'cbk9j9',
          zip: '55101',
        },
        {
          lat: 46.31608774430147,
          lng: -94.4965851214246,
          geohash: 'cbhz3x',
          zip: '55101',
        },
        {
          lat: 46.47939387998873,
          lng: -94.77739892252605,
          geohash: 'cbk87m',
          zip: '55101',
        },
      ],
    },
    {
      key: 'OK',
      locations: [
        {
          lat: 35.971379807667134,
          lng: -96.898153020577,
          geohash: '9y7heh',
          zip: '73101',
        },
        {
          lat: 36.011394602603794,
          lng: -96.81081777669212,
          geohash: '9y7hv5',
          zip: '73101',
        },
        {
          lat: 36.07950293527855,
          lng: -97.05818545150332,
          geohash: '9y6vr2',
          zip: '73101',
        },
        {
          lat: 35.920942293937834,
          lng: -96.77847048761964,
          geohash: '9y7hmg',
          zip: '73101',
        },
        {
          lat: 36.13749936853333,
          lng: -96.75190731405606,
          geohash: '9y7jw6',
          zip: '73101',
        },
      ],
    },
    {
      key: 'MT',
      locations: [
        {
          lat: 46.94148395494028,
          lng: -109.36012866016111,
          geohash: 'c865p3',
          zip: '59601',
        },
        {
          lat: 47.110683648430054,
          lng: -109.69868657375328,
          geohash: 'c83up8',
          zip: '59601',
        },
        {
          lat: 47.079326874198436,
          lng: -109.70340623599724,
          geohash: 'c83gzd',
          zip: '59601',
        },
        {
          lat: 46.79643030318399,
          lng: -109.43102900085663,
          geohash: 'c864jz',
          zip: '59601',
        },
        {
          lat: 46.90862742232602,
          lng: -109.56975303819496,
          geohash: 'c864fe',
          zip: '59601',
        },
      ],
    },
    {
      key: 'WA',
      locations: [
        {
          lat: 47.67036110082986,
          lng: -120.81507783156209,
          geohash: 'c26p4y',
          zip: '98816',
        },
        {
          lat: 47.7211455601903,
          lng: -120.61375465118365,
          geohash: 'c26prr',
          zip: '98822',
        },
        {
          lat: 47.91765059274723,
          lng: -120.76087375635807,
          geohash: 'c2d0s5',
          zip: '98826',
        },
        {
          lat: 47.56991383547703,
          lng: -120.90520022934646,
          geohash: 'c26n8e',
          zip: '98801',
        },
        {
          lat: 47.65897352737251,
          lng: -120.54979593508062,
          geohash: 'c26r0u',
          zip: '98811',
        },
      ],
    },
    {
      key: 'UT',
      locations: [
        {
          lat: 39.5223601005282,
          lng: -111.810219400164,
          geohash: '9x02zd',
          zip: '84101',
        },
        {
          lat: 39.292644594638226,
          lng: -111.80183571108995,
          geohash: '9wbrxc',
          zip: '84101',
        },
        {
          lat: 39.49376336688343,
          lng: -112.03327768485174,
          geohash: '9x02dt',
          zip: '84101',
        },
        {
          lat: 39.238076770074166,
          lng: -111.87198450444092,
          geohash: '9wbrnr',
          zip: '84101',
        },
        {
          lat: 39.599278694140196,
          lng: -112.12548083460455,
          geohash: '9x0328',
          zip: '84101',
        },
      ],
    },
    {
      key: 'CO',
      locations: [
        {
          lat: 39.30185302886934,
          lng: -105.28502789358377,
          geohash: '9wvps4',
          zip: '80201',
        },
        {
          lat: 39.20196158954215,
          lng: -105.36404704017347,
          geohash: '9wvp42',
          zip: '80201',
        },
        {
          lat: 39.00331386127546,
          lng: -105.3167856854224,
          geohash: '9wvjgk',
          zip: '80201',
        },
        {
          lat: 39.16523634277853,
          lng: -105.19038650941286,
          geohash: '9wvny3',
          zip: '80201',
        },
        {
          lat: 39.29748159726642,
          lng: -105.23646482486322,
          geohash: '9wvpt3',
          zip: '80201',
        },
      ],
    },
    {
      key: 'OH',
      locations: [
        {
          lat: 40.4532972652715,
          lng: -83.01373823347546,
          geohash: 'dphynu',
          zip: '43215',
        },
        {
          lat: 40.5402721633115,
          lng: -82.89180499208462,
          geohash: 'dpjn9u',
          zip: '43215',
        },
        {
          lat: 40.25347907245242,
          lng: -82.83185244953047,
          geohash: 'dpjhgp',
          zip: '43215',
        },
        {
          lat: 40.36351859152613,
          lng: -83.12309338874945,
          geohash: 'dphvs7',
          zip: '43215',
        },
        {
          lat: 40.19576659560525,
          lng: -83.07743971276743,
          geohash: 'dphutt',
          zip: '43215',
        },
      ],
    },
    {
      key: 'AL',
      locations: [
        {
          lat: 32.39670797816915,
          lng: -87.03906301476756,
          geohash: 'djf073',
          zip: '36104',
        },
        {
          lat: 32.21296488952031,
          lng: -86.75650429437431,
          geohash: 'djdr3b',
          zip: '36104',
        },
        {
          lat: 32.50441090610224,
          lng: -86.72760151841763,
          geohash: 'djf2fm',
          zip: '36104',
        },
        {
          lat: 32.30465549546211,
          lng: -87.0043468807703,
          geohash: 'djdpu0',
          zip: '36104',
        },
        {
          lat: 32.408742537013914,
          lng: -87.06651556905197,
          geohash: 'djf06g',
          zip: '36104',
        },
      ],
    },
    {
      key: 'IA',
      locations: [
        {
          lat: 42.11438685820486,
          lng: -93.6947865955781,
          geohash: '9zmref',
          zip: '50319',
        },
        {
          lat: 42.13145354717837,
          lng: -93.73463720248105,
          geohash: '9zmrej',
          zip: '50319',
        },
        {
          lat: 42.19839644280546,
          lng: -93.39146835165548,
          geohash: '9zt84c',
          zip: '50319',
        },
        {
          lat: 42.20227994675692,
          lng: -93.66586976692592,
          geohash: '9zt2hd',
          zip: '50319',
        },
        {
          lat: 41.83758571242798,
          lng: -93.57749040579812,
          geohash: '9zmqn8',
          zip: '50319',
        },
      ],
    },
    {
      key: 'NM',
      locations: [
        {
          lat: 34.31777438617065,
          lng: -105.84467676375691,
          geohash: '9whepr',
          zip: '87501',
        },
        {
          lat: 34.111629505237595,
          lng: -105.87939971743548,
          geohash: '9whdn9',
          zip: '87501',
        },
        {
          lat: 34.174086049236784,
          lng: -106.1814837180893,
          geohash: '9wh6rv',
          zip: '87501',
        },
        {
          lat: 34.50399649616238,
          lng: -105.89271871952931,
          geohash: '9whsq3',
          zip: '87501',
        },
        {
          lat: 34.22287498006324,
          lng: -106.08956836105143,
          geohash: '9whd9y',
          zip: '87501',
        },
      ],
    },
    {
      key: 'SC',
      locations: [
        {
          lat: 33.939393076492856,
          lng: -81.0830409545356,
          geohash: 'dnn34f',
          zip: '29201',
        },
        {
          lat: 33.72701484931229,
          lng: -81.07225153571726,
          geohash: 'djyrg5',
          zip: '29201',
        },
        {
          lat: 33.74285410418427,
          lng: -81.21223297037716,
          geohash: 'djypzy',
          zip: '29201',
        },
        {
          lat: 33.9950223485028,
          lng: -81.11172798563474,
          geohash: 'dnn36k',
          zip: '29201',
        },
        {
          lat: 33.899098493363695,
          lng: -81.10438074697704,
          geohash: 'dnn2f7',
          zip: '29201',
        },
      ],
    },
    {
      key: 'PA',
      locations: [
        {
          lat: 41.103060998840085,
          lng: -77.00674145241067,
          geohash: 'dr31zd',
          zip: '17101',
        },
        {
          lat: 41.306068271415064,
          lng: -77.26166061190892,
          geohash: 'dr34cz',
          zip: '17101',
        },
        {
          lat: 41.3784727032363,
          lng: -77.30807032966277,
          geohash: 'dr352u',
          zip: '17101',
        },
        {
          lat: 41.3878643443562,
          lng: -77.05766402310485,
          geohash: 'dr35qw',
          zip: '17101',
        },
        {
          lat: 41.349908321631105,
          lng: -77.16881851834493,
          geohash: 'dr355z',
          zip: '17101',
        },
      ],
    },
    {
      key: 'AZ',
      locations: [
        {
          lat: 33.93595938663374,
          lng: -111.13575490422477,
          geohash: '9w0cp1',
          zip: '85001',
        },
        {
          lat: 33.89306345569447,
          lng: -111.24387944375371,
          geohash: '9w0bud',
          zip: '85001',
        },
        {
          lat: 33.88615624144646,
          lng: -110.8952090124082,
          geohash: '9w10u8',
          zip: '85001',
        },
        {
          lat: 34.238549495866195,
          lng: -111.00141938121645,
          geohash: '9w14f0',
          zip: '85001',
        },
        {
          lat: 33.99380195676781,
          lng: -110.90603834883198,
          geohash: '9w11kk',
          zip: '85001',
        },
      ],
    },
    {
      key: 'MD',
      locations: [
        {
          lat: 39.004992955718855,
          lng: -76.73445466454675,
          geohash: 'dqcmvu',
          zip: '21401',
        },
        {
          lat: 38.929049120630424,
          lng: -76.79456975302278,
          geohash: 'dqcmkq',
          zip: '21401',
        },
        {
          lat: 39.14374719857972,
          lng: -76.53345738511733,
          geohash: 'dqcwdm',
          zip: '21401',
        },
        {
          lat: 39.144556862803725,
          lng: -76.56488625480283,
          geohash: 'dqcw9w',
          zip: '21401',
        },
        {
          lat: 39.03966216469269,
          lng: -76.61199760805698,
          geohash: 'dqcw0d',
          zip: '21401',
        },
      ],
    },
    {
      key: 'MA',
      locations: [
        {
          lat: 42.264912011206135,
          lng: -71.37113422038114,
          geohash: 'drt0ry',
          zip: '02108',
        },
        {
          lat: 42.27711474688163,
          lng: -71.29497439565611,
          geohash: 'drt298',
          zip: '02108',
        },
        {
          lat: 42.34170335089716,
          lng: -71.25769341329492,
          geohash: 'drt2fk',
          zip: '02108',
        },
        {
          lat: 42.42022945134897,
          lng: -71.23873477138841,
          geohash: 'drt36f',
          zip: '02108',
        },
        {
          lat: 42.43652220532074,
          lng: -71.27748447226591,
          geohash: 'drt36j',
          zip: '02108',
        },
      ],
    },
    {
      key: 'CA',
      locations: [
        {
          lat: 36.87772813346389,
          lng: -119.37709152392384,
          geohash: '9qe1g9',
          zip: '95814',
        },
        {
          lat: 36.77515878327318,
          lng: -119.49163439888444,
          geohash: '9qe10y',
          zip: '95814',
        },
        {
          lat: 36.85385702773446,
          lng: -119.22554822365016,
          geohash: '9qe1wv',
          zip: '95814',
        },
        {
          lat: 36.599668105433736,
          lng: -119.26446270118824,
          geohash: '9qe0nn',
          zip: '95814',
        },
        {
          lat: 36.876232012629664,
          lng: -119.39991225492683,
          geohash: '9qe1fc',
          zip: '95814',
        },
      ],
    },
    {
      key: 'ID',
      locations: [
        {
          lat: 43.967160776964626,
          lng: -114.83342221197107,
          geohash: '9ry64g',
          zip: '83701',
        },
        {
          lat: 44.052791356979796,
          lng: -114.83762472779885,
          geohash: '9ry6dg',
          zip: '83701',
        },
        {
          lat: 44.08268858926484,
          lng: -114.74972645143818,
          geohash: '9ry6uc',
          zip: '83701',
        },
        {
          lat: 44.2069123293681,
          lng: -114.723531624832,
          geohash: '9ry7mr',
          zip: '83701',
        },
        {
          lat: 44.089221162082836,
          lng: -114.79261706824612,
          geohash: '9ry6gf',
          zip: '83701',
        },
      ],
    },
    {
      key: 'WY',
      locations: [
        {
          lat: 43.01714090181205,
          lng: -107.11130909478669,
          geohash: '9xeudx',
          zip: '82001',
        },
        {
          lat: 43.02196376786164,
          lng: -107.39977622464741,
          geohash: '9xessp',
          zip: '82001',
        },
        {
          lat: 42.91909460318943,
          lng: -107.24718436779938,
          geohash: '9xespt',
          zip: '82001',
        },
        {
          lat: 43.15365358226124,
          lng: -107.29761243018936,
          geohash: '9xetqr',
          zip: '82001',
        },
        {
          lat: 42.93239642156844,
          lng: -107.3433350930645,
          geohash: '9xesjr',
          zip: '82001',
        },
      ],
    },
    {
      key: 'NC',
      locations: [
        {
          lat: 35.79983139452499,
          lng: -80.83763530273373,
          geohash: 'dnqe8m',
          zip: '27601',
        },
        {
          lat: 35.66374907530542,
          lng: -80.6268243618038,
          geohash: 'dnqdvk',
          zip: '27601',
        },
        {
          lat: 35.98006591328123,
          lng: -80.8584913652208,
          geohash: 'dnqs8j',
          zip: '27601',
        },
        {
          lat: 35.88713712036674,
          lng: -80.65043817407381,
          geohash: 'dnqshv',
          zip: '27601',
        },
        {
          lat: 35.73235156759999,
          lng: -80.70727080044648,
          geohash: 'dnqe72',
          zip: '27601',
        },
      ],
    },
    {
      key: 'LA',
      locations: [
        {
          lat: 30.55100935732308,
          lng: -92.40088907848894,
          geohash: '9vqmc3',
          zip: '70801',
        },
        {
          lat: 30.20672226074988,
          lng: -92.2647148683936,
          geohash: '9vq7u6',
          zip: '70801',
        },
        {
          lat: 30.4229309481319,
          lng: -92.2997836535288,
          geohash: '9vqm5d',
          zip: '70801',
        },
        {
          lat: 30.46517252929503,
          lng: -92.50469366382532,
          geohash: '9vqjr4',
          zip: '70801',
        },
        {
          lat: 30.23143722703061,
          lng: -92.17755870829293,
          geohash: '9vq7yr',
          zip: '70801',
        },
      ],
    },
  ];

  return STATES[index % STATES.length];
}
