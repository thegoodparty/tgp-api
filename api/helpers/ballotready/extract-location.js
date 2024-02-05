/* eslint-disable object-shorthand */

const appBase = sails.config.custom.appBase || sails.config.appBase;

module.exports = {
  inputs: {
    row: {
      type: 'json',
    },
  },

  exits: {
    success: {
      description: 'Campaign Found',
      responseType: 'ok',
    },
    badRequest: {
      description: 'Bad Request',
      responseType: 'badRequest',
    },
  },

  fn: async function (inputs, exits) {
    try {
      const { row } = inputs;

      let locationName = '';
      let locationLevel = row.level;

      switch (locationLevel) {
        case 'state':
          locationName = extractStateName(row);
          break;
        case 'county':
          locationName = extractCountyName(row);
          break;
        case 'city':
          locationName = extractCityName(row);
          if (row.position_name.includes('Village')) {
            locationLevel = 'village';
          } else if (row.position_name.includes('Township')) {
            locationLevel = 'township';
          } else if (row.position_name.includes('Town')) {
            locationLevel = 'town';
          } else if (
            row.position_name.includes(
              'County Multi-Jurisdictional Municipal Judge',
            )
          ) {
            locationLevel = 'county';
          }
          break;
        default:
          locationName = row.position_name.split(' ')[0];
          break;
      }

      return exits.success({
        name: locationName,
        level: locationLevel,
      });
    } catch (e) {
      console.log('error at extract-location helper', e);
      return exits.success(false);
    }
  },
};

function extractStateName(row) {
  return row.state;
}

function extractCountyName(row) {
  let countyName = row.position_name.includes('County')
    ? row.position_name.split(' County')[0].trim()
    : row.sub_area_value.split(' ')[0].trim();
  // Remove "County" suffix from the name
  const name = countyName.replace(/ County$/, '');
  if (name !== '') {
    return name;
  }

  const specialCases = [
    'Borough ',
    // 'Borough Mayor',
    // 'Borough Council',
    'Municipal Mayor',
    'Court Judge',
    'School Board',
    'Township Justice of the Peace',
    'Village Justice of the Peace',
    'General Sessions Court Judge',
    'Justice of the Peace',
    'City Sheriff',
    'City Circuit Attorney',
    'City Public Administrator',
    'Agricultural Extension Council',
    'City Comptroller',
    'Municipal Assembly',
    'Community Council',
    'Criminal District Court Magistrate Judge',
    'District Attorney',
    'Attorney',
    'Council Chairman',
    'Mayor',
    'Auditor',
    'Clerk',
    'President',
  ];

  for (let i = 0; i < specialCases.length; i++) {
    const sc = specialCases[i];
    if (row.position_name.includes(sc)) {
      return row.position_name.split(` ${sc}`)[0].trim();
    }
  }

  if (row.position_name.includes('City')) {
    return extractCityName(row);
  }

  return name;
}

function extractCityName(row) {
  const specialCases = [
    'Village',
    'Town',
    'County Multi-Jurisdictional Municipal Judge',
    // 'City Mayor',
    // 'City Commission',
    // 'City Board',
    // 'City Treasurer',
    // 'City Review Board',
    'Borough ',
    // 'Borough Mayor',
    // 'Borough Council',
    // 'City Justice',
    // 'City Collector',
    // 'City Judge',
    'School Board',
    'Neighborhood Council',
    'Registrar of Voters',
    'Justice of the Peace',
    // 'City Clerk/Treasurer',
    // 'City Clerk',
    // 'City Marshal',
    // 'City Constable',
    // 'City Rent Control Board',
    // 'Municipal Advisory Council',
    'Planning Area Board',
    // 'City Auditor',
    // 'City Police Chief',
    // 'City Attorney',
    'City ',

    'Municipal ',
    // 'Municipal Court Judge',
    // 'City Recorder/Treasurer',
    // 'City Municipal Judge',
    'Mayor',
    // 'Borough Commissioner',
    // 'Municipal Judge',
    'Housing Authority Board',
    // 'City Court Judge',
    // 'City Court Marshal',
    // 'City First Constable',
    'Scholarship',
    'Board of ',
    // 'City Recorder',
    // 'City Assessor',
    // 'City Police and Fire Commission',
    'Trustee',
    'Library Board',
    'Parks and Recreation Commission',
    // 'Municipal Light Board',
    // 'City Library Board',
    'Supervisor of the Checklist',
    'Charter Review Commission',
    'Commissioner',
  ];

  for (let i = 0; i < specialCases.length; i++) {
    const sc = specialCases[i];
    if (row.position_name.includes(sc)) {
      return row.position_name.split(` ${sc}`)[0].trim();
    }
  }

  return row.sub_area_value;
}
