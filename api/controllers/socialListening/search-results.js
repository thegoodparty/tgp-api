const moment = require('moment');

module.exports = {
  friendlyName: 'Pulsar Social listening for brands',

  inputs: {
    searchId: {
      type: 'string',
    },
    limit: {
      type: 'number',
      defaultsTo: 10,
    },
    save: {
      type: 'boolean',
      defaultsTo: false,
    },
  },

  exits: {
    success: {
      description: 'ok',
    },

    badRequest: {
      description: 'Error',
      responseType: 'badRequest',
    },
  },

  fn: async function(inputs, exits) {
    const { searchId, limit, save } = inputs;
    if (!save) {
      const existing = await KeyValue.findOne({ key: searchId });
      if (existing) {
        return exits.success(JSON.parse(existing.value));
      }
    }
    try {
      const query = `
        query SearchPosts($stat: Stat, $dimension: Dimension, $options: Option, $filter: Filter!) {
          results(stat: $stat, dimension: $dimension, options: $options, filter: $filter) {
            total
            results {
              content
              domainName
              engagement
              likesCount
              url
              userAvatarUrl
              images
              userName
              userScreenName
              publishedAt
            }
          }
        }
      `;

      const today = moment().format('YYYY-MM-DD');
      const lastMonth = moment()
        .subtract(30, 'days')
        .format('YYYY-MM-DD');

      const variables = {
        filter: {
          dateFrom: `${lastMonth}T23:59:59Z`,
          dateTo: `${today}T23:59:59Z`,
          searches: [searchId],
        },
        options: {
          sortBy: 'REACTION',
          limit,
        },
      };

      const data = await sails.helpers.socialListening.pulsarQueryHelper(
        query,
        variables,
        'trac',
      );

      const results = data ? data.results : [];
      const resultsStr = JSON.stringify(results);
      await KeyValue.findOrCreate(
        { key: searchId },
        {
          key: searchId,
          value: resultsStr,
        },
      );
      await KeyValue.updateOne({ key: searchId }).set({
        key: searchId,
        value: resultsStr,
      });

      return exits.success(results);
    } catch (e) {
      console.log('error at socialListening/goodparty-search');
      console.log(e);
      return exits.success({
        error: true,
        e,
      });
    }
  },
};

const res = {
  total: 34,
  results: [
    {
      content:
        '11Got stuck in Paris last night due to work on the line &amp; whatnot, got randomly invited to a party in a huge fucking house in Paris with a bunch of industry peops &amp; a famous french singer, got shitfaced and sang ace of bace lyrics at the top of my voice for four hours 😎 #goodparty',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 58,
      likesCount: 55,
      url: 'https://twitter.com/lewca/status/1543538634640457728',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1412835156478595077/MH2GxnoL_normal.jpg',
      images: [],
    },

    {
      content:
        'Absolutely dialed in for the puzzle party #goodparty @goodpartyorg https://t.co/xCuBdHK9Z2',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 4,
      likesCount: 4,
      url: 'https://twitter.com/JackNagel12/status/1539779620844630016',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1199161900547944448/oLky_iVA_normal.jpg',
      images: [
        {
          title: '',
          url: 'https://pbs.twimg.com/media/FV5lZzvUUAAL1RQ.jpg',
        },
      ],
    },
    {
      content:
        'Our own @mctavish4mn has been certified a "Good Candidate" by @goodpartyorg (...building tools to change the rules and disrupt the corrupt, creating a brighter future for all!)\n\nCheck it out here: https://t.co/Zqj4uUgZIh',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 5,
      likesCount: 3,
      url: 'https://twitter.com/IndyMN/status/1542538033244917760',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1141180984097947648/O5wMorZF_normal.png',
      images: [],
    },
    {
      content:
        'Today is a good day to declare your independence and help us build a movement to stop this doom loop. https://t.co/S4BmAxU2dA #goodparty',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 11,
      likesCount: 9,
      url: 'https://twitter.com/goodpartyorg/status/1540787472308658176',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1526243183683854338/k5gUoWL8_normal.png',
      images: [],
    },
    {
      content:
        'Vote different - check out these "Good Certified" candidates running for office in the US @goodpartyorg \n\n https://t.co/aZFYmnO6dn \n\n#Midterms2022 #Election2022 #Independent #libertarian #VoteThemOut',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 3,
      likesCount: 2,
      url: 'https://twitter.com/GreywolfJustin/status/1532829962281316352',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1362086154648965121/MDeLif2c_normal.jpg',
      images: [],
    },
    {
      content:
        'RT @goodpartyorg: Young people created this country. Why are people 3-4 times their age running it? https://t.co/NpKHh5fdcG',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/RGuy1152/status/1544397652367798272',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1506479621893545987/CcubR3Vc_normal.jpg',
      images: [],
    },
    {
      content:
        'RT @IndyMN: Our own @mctavish4mn has been certified a "Good Candidate" by @goodpartyorg (...building tools to change the rules and disrupt the corrupt, creating a brighter future for all!)\n\nCheck it out here: https://t.co/Zqj4uUgZIh',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/3rdcrop/status/1544370096000434176',
      userAvatarUrl:
        'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
      images: [],
    },
    {
      content:
        '@IndyMN @mctavish4mn @goodpartyorg The perfect candidate for college educated white women who dont know what to do with there vote',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/Jeff15551554/status/1544322516310695936',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1538684283765854208/u-tPUVwC_normal.jpg',
      images: [],
    },
    {
      content:
        'RT @IndyMN: Our own @mctavish4mn has been certified a "Good Candidate" by @goodpartyorg (...building tools to change the rules and disrupt the corrupt, creating a brighter future for all!)\n\nCheck it out here: https://t.co/Zqj4uUgZIh',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/mctavish4mn/status/1544321850683047944',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1512060005947785223/k-YqhJJO_normal.jpg',
      images: [],
    },
    {
      content:
        'RT @goodpartyorg: Young people created this country. Why are people 3-4 times their age running it? https://t.co/NpKHh5fdcG',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/pegah_pegah555/status/1544137940414001153',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/3687131966/0e187df3f4f4cf328bc868d3052ea012_normal.jpeg',
      images: [],
    },
    {
      content:
        'Wishing everyone a happy Independence Day! Declare your independence and celebrate with a #goodparty',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 1,
      likesCount: 1,
      url: 'https://twitter.com/goodpartyorg/status/1544059665801150464',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1526243183683854338/k5gUoWL8_normal.png',
      images: [],
    },
    {
      content:
        'Mass psyops AR is emerging unchecked, as increasingly realistic AI NPC profiles roam + groom socials, distorting reality + unaware minds with commercially + geopolitically motivated FUD, desires, hatred of self + others. \n\nIT wants us divided and hopeless. Fuck IT @goodpartyorg',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 1,
      likesCount: 1,
      url: 'https://twitter.com/farhad667/status/1544046948092559361',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/76384673/engagement_me_over_the_shoulder_normal.JPG',
      images: [],
    },
    {
      content:
        'RT @lewca: Got stuck in Paris last night due to work on the line &amp; whatnot, got randomly invited to a party in a huge fucking house in Paris with a bunch of industry peops &amp; a famous french singer, got shitfaced and sang ace of bace lyrics at the top of my voice for four hours 😎 #goodparty',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/IndMusCol/status/1543829276134412293',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1519078533733228549/11Z6xhGZ_normal.jpg',
      images: [],
    },
    {
      content:
        'RT @lewca: Got stuck in Paris last night due to work on the line &amp; whatnot, got randomly invited to a party in a huge fucking house in Paris with a bunch of industry peops &amp; a famous french singer, got shitfaced and sang ace of bace lyrics at the top of my voice for four hours 😎 #goodparty',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/caravanmediapr/status/1543702570472013824',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1542912669346308103/-yk1T_IO_normal.jpg',
      images: [],
    },
    {
      content:
        '@FearlessPAC Check out @goodpartyorg !! You could do wonders together.',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/daniel_CAdreamn/status/1543607630446223360',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1429613669659283470/A5IGr3cq_normal.jpg',
      images: [],
    },
    {
      content:
        'RT @lewca: Got stuck in Paris last night due to work on the line &amp; whatnot, got randomly invited to a party in a huge fucking house in Paris with a bunch of industry peops &amp; a famous french singer, got shitfaced and sang ace of bace lyrics at the top of my voice for four hours 😎 #goodparty',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/PenHitsPaper/status/1543539157427011584',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1505189501206994953/5oiSVrgh_normal.jpg',
      images: [],
    },
    {
      content: '@SocialistMMA @goodpartyorg there\'s no "good" side.',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/ChicagoOpen/status/1542900267129229314',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1485317658375593987/ARsMuZly_normal.jpg',
      images: [],
    },
    {
      content:
        'Check it out and give @mctavish4mn an endorsement at @goodpartyorg https://t.co/dJLjxTCYM9',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 1,
      likesCount: 1,
      url: 'https://twitter.com/KaraokePhil/status/1542539687029514245',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1015053181519319040/oHWQ0JLt_normal.jpg',
      images: [],
    },
    {
      content:
        '@marwilliamson America 2.0 needs a 2.0 process.\nLearn more at @goodpartyorg',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/aslani/status/1542529612789362689',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1390371712722640897/iainQKdG_normal.jpg',
      images: [],
    },
    {
      content:
        "Sophie's idea of a #goodparty = friends, family and frisbees! https://t.co/DsyMuwKbAZ",
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/Jaredalper/status/1541111275652108289',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1400162700475437058/m10u-QMy_normal.jpg',
      images: [],
    },
    {
      content:
        '@DannyDeVito The establishment needs a major overhaul. Good Party is enabling voices and action. @goodpartyorg',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/aslani/status/1540950031871709184',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1390371712722640897/iainQKdG_normal.jpg',
      images: [],
    },
    {
      content:
        'RT @goodpartyorg: Today is a good day to declare your independence and help us build a movement to stop this doom loop. https://t.co/S4BmAxU2dA #goodparty',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/farhad667/status/1540857280039489536',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/76384673/engagement_me_over_the_shoulder_normal.JPG',
      images: [],
    },
    {
      content:
        "RT @goodpartyorg: If today you're feeling ready to fuck the system up, come check us out. https://t.co/S4BmAybDCa https://t.co/Sg8V1PRfgR",
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/daniel_CAdreamn/status/1540486985105625088',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1429613669659283470/A5IGr3cq_normal.jpg',
      images: [],
    },
    {
      content:
        '@goodpartyorg Just signed up! FYI: verification code email went to junk(spam) folder on iOS mail client.',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 2,
      url: 'https://twitter.com/daniel_CAdreamn/status/1540486969892798464',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1429613669659283470/A5IGr3cq_normal.jpg',
      images: [],
    },
    {
      content: '@ConnieSchultz Take action at @goodpartyorg',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/aslani/status/1540449523281133570',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1390371712722640897/iainQKdG_normal.jpg',
      images: [],
    },

    {
      content:
        'Beach house was a #goodparty!! @goodpartyorg https://t.co/GucEK02tyZ',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/ds3specialist/status/1539769688057454592',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1539768729675759617/zRqLV_lp_normal.jpg',
      images: [],
    },
    {
      content: 'at a #goodparty, on Tuesday. ❤️🎉🤩',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 2,
      likesCount: 2,
      url: 'https://twitter.com/farhad667/status/1536970229149863937',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/76384673/engagement_me_over_the_shoulder_normal.JPG',
      images: [],
    },
    {
      content:
        '@TheCourtesan1 @PeterPhill16 @RenaldoGouws @brettherron All? Doubt it.\nThen it is Chinese owned or #GoodParty owned press.',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 2,
      url: 'https://twitter.com/Blessed11587260/status/1536058227099566080',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1319730788980707330/eUY3PtBW_normal.jpg',
      images: [],
    },
    {
      content:
        'The weekend update is released. Give it a listen.\n\nhttps://t.co/OjBtllZw9l\n\n#LarryForTN12\n#Constitution\n#Constitutionalist\n#Conservative\n#Tennessee\n#SevierCounty\n#Sevierville\n#PigeonForge\n#Gatlinburg\n#Seymour\n#BoydsCreek\n#StandInTheArena \n#Independent\n#RestoreLiberty\n#GoodParty',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/LarryForTN12/status/1535564600833454080',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1437436759411986437/Yh1DqYgI_normal.jpg',
      images: [],
    },
    {
      content:
        'The weekend update is released. Give it a listen.\n\nhttps://t.co/a7mztjzed7\n\n#LarryForTN12\n#Constitution\n#Constitutionalist\n#Conservative\n#Tennessee\n#SevierCounty\n#Sevierville\n#PigeonForge\n#Gatlinburg\n#Seymour\n#BoydsCreek\n#Independent\n#RestoreLiberty\n#GoodParty',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/LiesLiberty/status/1535564496789458945',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1396831850685939712/8M003LgG_normal.jpg',
      images: [],
    },
    {
      content:
        'RT @GreywolfJustin: Vote different - check out these "Good Certified" candidates running for office in the US @goodpartyorg \n\n https://t.co/aZFYmnO6dn \n\n#Midterms2022 #Election2022 #Independent #libertarian #VoteThemOut',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/Edward162735236/status/1532869873721810944',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1538114682619412480/14BKim1o_normal.jpg',
      images: [],
    },
    {
      content:
        'Get rid of the controlling two-party system #goodparty https://t.co/ejR6SQEwig',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/Shadowb20857051/status/1532409261476790275',
      userAvatarUrl:
        'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
      images: [],
    },
    {
      content:
        "@StevenTDennis The corruption is unreal as It wants more money! Be it through war, selling guns, etc. in the name of freedom.\nWe are not powerless. Let's unite. It's us vs. It! Learn more at:\n@goodpartyorg",
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 1,
      url: 'https://twitter.com/aslani/status/1532373782253342720',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/1390371712722640897/iainQKdG_normal.jpg',
      images: [],
    },
    {
      content:
        'Latest poll result: AKP drops below 30 percent, GOOD Party exceeds 20 percent https://t.co/Jy5McBhmqG \n\n#politics #election #poll #vote #share #research #survey #AkParty #CHP #GoodParty',
      visibility: 1.0,
      commentsCount: null,
      domainName: 'twitter.com',
      engagement: 0,
      likesCount: 0,
      url: 'https://twitter.com/businessturkey/status/1532000074129195010',
      userAvatarUrl:
        'https://pbs.twimg.com/profile_images/982197878318706689/L57sfH-F_normal.jpg',
      images: [],
    },
  ],
  extensions: {
    variables: {
      filter: {
        dateFrom: '2022-05-06T23:59:59Z',
        dateTo: '2022-07-06T00:00:00Z',
        searches: ['2bade780970fd5134f8bd216b568bc8e'],
      },
      options: {
        sortBy: 'REACTION',
      },
    },
  },
};
