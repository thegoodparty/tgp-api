const axios = require('axios');

const l2ApiKey = sails.config.custom.l2Data || sails.config.l2Data;

module.exports = {
  friendlyName: 'Seed election types',

  inputs: {},
  exits: {
    success: {
      description: 'OK',
    },
    badRequest: {
      description: 'Error',
    },
  },

  fn: async function (inputs, exits) {
    // This list of miscellaneous districts is used to seed the election types table
    // It's manually compiled from the L2 VMUniform columns
    const miscellaneousDistricts = {
      City: [
        'City_Council_Commissioner_District',
        'City_Mayoral_District',
        'Election_Commissioner_District',
        'Proposed_City_Commissioner_District',
      ],
      State: [
        'State_Senate_District',
        'State_House_District',
        'US_Congressional_District',
      ],
      Education: [
        'City_School_District',
        'College_Board_District',
        'Community_College',
        'Community_College_Commissioner_District',
        'Community_College_SubDistrict',
        'County_Board_of_Education_District',
        'County_Board_of_Education_SubDistrict',
        'County_Community_College_District',
        'County_Legislative_District',
        'County_Superintendent_of_Schools_District',
        'County_Unified_School_District',
        'Board_of_Education_District',
        'Board_of_Education_SubDistrict',
        'Education_Commission_District',
        'Educational_Service_District',
        'Elementary_School_District',
        'Elementary_School_SubDistrict',
        'Exempted_Village_School_District',
        'High_School_District',
        'High_School_SubDistrict',
        'Middle_School_District',
        'Proposed_Elementary_School_District',
        'Proposed_Unified_School_District',
        'Regional_Office_of_Education_District',
        'School_Board_District',
        'School_District',
        'School_District_Vocational',
        'School_Facilities_Improvement_District',
        'School_Subdistrict',
        'Service_Area_District',
        'Superintendent_of_Schools_District',
        'Unified_School_District',
        'Unified_School_SubDistrict',
      ],
      Judicial: [
        'District_Attorney',
        'Judicial_Appellate_District',
        'Judicial_Circuit_Court_District',
        'Judicial_County_Board_of_Review_District',
        'Judicial_County_Court_District',
        'Judicial_District',
        'Judicial_District_Court_District',
        'Judicial_Family_Court_District',
        'Judicial_Jury_District',
        'Judicial_Juvenile_Court_District',
        'Judicial_Sub_Circuit_District',
        'Judicial_Superior_Court_District',
        'Judicial_Supreme_Court_District',
        'Municipal_Court_District',
        'Judicial_Magistrate_Division',
      ],
    };

    let states = [
      'AL',
      'AK',
      'AZ',
      'AR',
      'CA',
      'CO',
      'CT',
      'DE',
      'DC',
      'FL',
      'GA',
      'HI',
      'ID',
      'IL',
      'IN',
      'IA',
      'KS',
      'KY',
      'LA',
      'ME',
      'MD',
      'MA',
      'MI',
      'MN',
      'MS',
      'MO',
      'MT',
      'NE',
      'NV',
      'NH',
      'NJ',
      'NM',
      'NY',
      'NC',
      'ND',
      'OH',
      'OK',
      'OR',
      'PA',
      'RI',
      'SC',
      'SD',
      'TN',
      'TX',
      'UT',
      'VT',
      'VA',
      'WA',
      'WV',
      'WI',
      'WY',
    ];

    try {
      for (const state of states) {
        console.log('seeding state', state);
        for (const category of Object.keys(miscellaneousDistricts)) {
          console.log('seeding category', category);
          for (const district of miscellaneousDistricts[category]) {
            try {
              //   if (columns.length > 0) {
              console.log('checking district', district);
              let columnValues = await querySearchColumn(district, state);
              console.log('columnValues', columnValues.length);
              //   if (columns.includes(district.replace(/_/g, ' '))) {
              const blankValues = [`${state}##`, `${state}####`, '', ' '];
              const filteredValues = columnValues.filter(
                (value) => !blankValues.includes(value),
              );
              console.log('filteredValues', filteredValues.length);
              if (filteredValues.length > 1) {
                console.log('FOUND! district', district);
                await ElectionType.findOrCreate(
                  {
                    name: district,
                    state: state,
                    category: category,
                  },
                  {
                    name: district,
                    state: state,
                    category: category,
                  },
                );
                // }
              }
            } catch (e) {
              console.log('error at seed election types', e);
            }
          }
        }
      }
    } catch (e) {
      console.log('error in seed election types', e);
      return exits.badRequest({
        message: 'error',
      });
    }
  },
};

// This was deprecated because it returns too many columns with blank results.
async function getSearchColumns(electionState) {
  let searchColumns = [];
  try {
    let searchUrl = `https://api.l2datamapping.com/api/v2/customer/application/columns/1OSR/VM_${electionState}/?id=1OSR&apikey=${l2ApiKey}`;
    const response = await axios.get(searchUrl);
    if (response?.data?.columns && response.data.columns.length > 0) {
      const columnData = response.data.columns;
      for (const columnObj of columnData) {
        searchColumns.push(columnObj.name);
      }
    }
  } catch (e) {
    console.log('error at getSearchColumns', e);
  }
  return searchColumns;
}

async function querySearchColumn(searchColumn, electionState) {
  let searchValues = [];
  try {
    let searchUrl = `https://api.l2datamapping.com/api/v2/customer/application/column/values/1OSR/VM_${electionState}/${searchColumn}?id=1OSR&apikey=${l2ApiKey}`;
    const response = await axios.get(searchUrl);
    if (response?.data?.values && response.data.values.length > 0) {
      searchValues = response.data.values;
    }
  } catch (e) {
    console.log('error at querySearchColumn', e);
  }
  return searchValues;
}
