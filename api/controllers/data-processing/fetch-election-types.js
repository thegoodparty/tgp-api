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
      County: ['County_Commissioner_District', 'County_Supervisorial_District'],
      State: [
        'US_Congressional_District',
        'State_Senate_District',
        'State_House_District',
        'State_Board_of_Equalization',
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
        'Judicial_Chancery_Court',
        'Justice_of_the_Peace',
      ],
      Water: [
        'Coast_Water_District',
        'Consolidated_Water_District',
        'County_Water_District',
        'County_Water_Landowner_District',
        'County_Water_SubDistrict',
        'Metropolitan_Water_District',
        'Mountain_Water_District',
        'Municipal_Water_District',
        'Municipal_Water_SubDistrict',
        'River_Water_District',
        'Water_Agency',
        'Water_Agency_SubDistrict',
        'Water_Conservation_District',
        'Water_Conservation_SubDistrict',
        'Water_Control__Water_Conservation',
        'Water_Control__Water_Conservation_SubDistrict',
        'Water_District',
        'Water_Public_Utility_District',
        'Water_Public_Utility_Subdistrict',
        'Water_Replacement_District',
        'Water_Replacement_SubDistrict',
        'Water_SubDistrict',
      ],
      Fire: [
        'County_Fire_District',
        'Fire_District',
        'Fire_Maintenance_District',
        'Fire_Protection_District',
        'Fire_Protection_SubDistrict',
        'Fire_Protection_Tax_Measure_District',
        'Fire_Service_Area_District',
        'Fire_SubDistrict',
        'Independent_Fire_District',
        'Proposed_Fire_District',
        'Unprotected_Fire_District',
      ],
      Transit: [
        'Bay_Area_Rapid_Transit',
        'Metro_Transit_District',
        'Rapid_Transit_District',
        'Rapid_Transit_SubDistrict',
        'Transit_District',
        'Transit_SubDistrict',
      ],
      Service: [
        'Community_Service_District',
        'Community_Service_SubDistrict',
        'County_Service_Area',
        'County_Service_Area_SubDistrict',
        'TriCity_Service_District',
        'Library_Services_District',
      ],
      Misc: [
        'Airport_District',
        'Annexation_District',
        'Aquatic_Center_District',
        'Aquatic_District',
        'Assessment_District',
        'Bonds_District',
        'Career_Center',
        'Cemetery_District',
        'Central_Committee_District',
        'Chemical_Control_District',
        'Committee_Super_District',
        'Communications_District',
        'Community_College_At_Large',
        'Community_Council_District',
        'Community_Council_SubDistrict',
        'Community_Facilities_District',
        'Community_Facilities_SubDistrict',
        'Community_Hospital_District',
        'Community_Planning_Area',
        'Congressional_Township',
        'Conservation_District',
        'Conservation_SubDistrict',
        'Control_Zone_District',
        'Corrections_District',
        'County_Hospital_District',
        'County_Library_District',
        'County_Memorial_District',
        'County_Paramedic_District',
        'County_Sewer_District',
        'Democratic_Convention_Member',
        'Democratic_Zone',
        'Designated_Market_Area_DMA',
        'Drainage_District',
        'Educational_Service_Subdistrict',
        'Emergency_Communication_911_District',
        'Emergency_Communication_911_SubDistrict',
        'Enterprise_Zone_District',
        'EXT_District',
        'Facilities_Improvement_District',
        'Flood_Control_Zone',
        'Forest_Preserve',
        'Garbage_District',
        'Geological_Hazard_Abatement_District',
        'Health_District',
        'Hospital_SubDistrict',
        'Improvement_Landowner_District',
        'Irrigation_District',
        'Irrigation_SubDistrict',
        'Island',
        'Land_Commission',
        'Landscaping_And_Lighting_Assessment_Distric',
        'Law_Enforcement_District',
        'Learning_Community_Coordinating_Council_District',
        'Levee_District',
        'Levee_Reconstruction_Assesment_District',
        'Library_District',
        'Library_SubDistrict',
        'Lighting_District',
        'Local_Hospital_District',
        'Local_Park_District',
        'Maintenance_District',
        'Master_Plan_District',
        'Memorial_District',
        'Metro_Service_District',
        'Metro_Service_Subdistrict',
        'Mosquito_Abatement_District',
        'Multi_township_Assessor',
        'Municipal_Advisory_Council_District',
        'Municipal_Utility_District',
        'Municipal_Utility_SubDistrict',
        'Museum_District',
        'Northeast_Soil_and_Water_District',
        'Open_Space_District',
        'Open_Space_SubDistrict',
        'Other',
        'Paramedic_District',
        'Park_Commissioner_District',
        'Park_District',
        'Park_SubDistrict',
        'Planning_Area_District',
        'Police_District',
        'Port_District',
        'Port_SubDistrict',
        'Power_District',
        'Proposed_City',
        'Proposed_Community_College',
        'Proposed_District',
        'Public_Airport_District',
        'Public_Regulation_Commission',
        'Public_Service_Commission_District',
        'Public_Utility_District',
        'Public_Utility_SubDistrict',
        'Reclamation_District',
        'Recreation_District',
        'Recreational_SubDistrict',
        'Republican_Area',
        'Republican_Convention_Member',
        'Resort_Improvement_District',
        'Resource_Conservation_District',
        'Road_Maintenance_District',
        'Rural_Service_District',
        'Sanitary_District',
        'Sanitary_SubDistrict',
        'Sewer_District',
        'Sewer_Maintenance_District',
        'Sewer_SubDistrict',
        'Snow_Removal_District',
        'Soil_And_Water_District',
        'Soil_And_Water_District_At_Large',
        'Special_Reporting_District',
        'Special_Tax_District',
        'Storm_Water_District',
        'Street_Lighting_District',
        'TV_Translator_District',
        'Unincorporated_District',
        'Unincorporated_Park_District',
        'Ute_Creek_Soil_District',
        'Vector_Control_District',
        'Vote_By_Mail_Area',
        'Wastewater_District',
        'Weed_District',
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
        console.log('Seeding state', state);
        // make an API call to get all the columns for the state
        let columns = await getAllStateColumns(state);
        console.log(`Got ${columns.length} Raw Columns for state ${state}`);
        // filter the columns to only include the ones that are in the miscellaneousDistricts object
        let columnsToCheck = [];
        for (const category of Object.keys(miscellaneousDistricts)) {
          for (const district of miscellaneousDistricts[category]) {
            if (columns.includes(district)) {
              columnsToCheck.push({ district, category });
            }
          }
        }

        let columnsMatched = 0;
        let columnsChecked = 0;
        for (const { district, category } of columnsToCheck) {
          await new Promise((resolve) => setTimeout(resolve, 7000));
          columnsChecked++;
          // L2 returns columns for states even if they don't have any values
          // so we need to check if the column has any values before we add it to the database
          let columnValues = await querySearchColumn(district, state);
          console.log(
            `[${state}] Checking column ${columnsChecked} / ${columnsToCheck.length}. Columns found: ${columnsMatched}`,
          );
          const blankValues = [`${state}##`, `${state}####`, '', ' '];
          const filteredValues = columnValues.filter(
            (value) => !blankValues.includes(value),
          );
          if (filteredValues.length > 1) {
            // console.log(`FOUND! district ${district}`);
            columnsMatched++;
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
          }
        }

        console.log(
          `Found ${columnsMatched} Election Types for state ${state}`,
        );
        await new Promise((resolve) => setTimeout(resolve, 7000));
      }
    } catch (e) {
      console.log('error in seed election types', e);
      return exits.badRequest({
        message: 'error',
      });
    }
  },
};

async function getAllStateColumns(electionState) {
  let columns = [];
  let columnObjects = [];
  try {
    let searchUrl = `https://api.l2datamapping.com/api/v2/customer/application/columns/1OSR/VM_${electionState}?id=1OSR&apikey=${l2ApiKey}`;
    const response = await axios.get(searchUrl);

    if (response?.data?.columns && response.data.columns.length > 0) {
      columnObjects = response.data.columns;
      // filter each columnObject so that it only includes .type = "ENUM"
      columnObjects = columnObjects.filter(
        (value) => value?.type && value.type === 'ENUM',
      );
      // columns are the .id of the column objects
      columns = columnObjects.map((column) => column.id);
    } else if (
      response?.data?.message &&
      response.data.message.includes('API threshold reached')
    ) {
      console.log('L2-Data API threshold reached');
      await sails.helpers.slack.slackHelper(
        {
          title: 'L2-Data API threshold reached',
          body: `Error! L2-Data API threshold reached for ${searchColumn} in ${electionState}.`,
        },
        'dev',
      );
    }
  } catch (e) {
    console.log('error at getAllStateColumns', e);
  }
  return columns;
}

async function querySearchColumn(searchColumn, electionState) {
  let searchValues = [];
  try {
    let searchUrl = `https://api.l2datamapping.com/api/v2/customer/application/column/values/1OSR/VM_${electionState}/${searchColumn}?id=1OSR&apikey=${l2ApiKey}`;
    const response = await axios.get(searchUrl);
    if (response?.data?.values && response.data.values.length > 0) {
      searchValues = response.data.values;
    } else if (
      response?.data?.message &&
      response.data.message.includes('API threshold reached')
    ) {
      console.log('L2-Data API threshold reached');
      await sails.helpers.slack.slackHelper(
        {
          title: 'L2-Data API threshold reached',
          body: `Error! L2-Data API threshold reached for ${searchColumn} in ${electionState}.`,
        },
        'dev',
      );
    }
  } catch (e) {
    console.log('error at querySearchColumn', e);
  }
  return searchValues;
}
