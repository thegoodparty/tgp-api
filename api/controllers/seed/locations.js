// This script is used to find locations (municipality and county) missing from the database
// And then geocode them using the Google Maps API

const appBase = sails.config.custom.appBase || sails.config.appBase;
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const { Client } = require('@googlemaps/google-maps-services-js');

let csvFilePath = path.join(__dirname, '../../../data/locations.csv');

const googleApiKey =
  sails.config.custom.googleApiKey || sails.config.googleApiKey;

let cityCount = 0;
let countyCount = 0;
module.exports = {
  inputs: {},

  exits: {},

  async fn(inputs, exits) {
    try {
      let rows = await loadCSV(csvFilePath);
      for (const row of rows) {
        await searchLocations(row);
        console.log('waiting 5 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
      return exits.success({
        message: `inserted ${cityCount} city locations and ${countyCount} county locations`,
      });
    } catch (e) {
      console.log('Error in seed', e);
      return exits.success({
        message: 'Error in seed',
        e,
        error: JSON.stringify(e),
      });
    }
  },
};

async function loadCSV(filePath) {
  let rows = [];
  let finished = false;
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      rows.push(row);
    })
    .on('end', () => {
      finished = true;
    });
  while (!finished) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return rows;
}

async function searchLocations(row) {
  try {
    // const l2Counties = path.join(__dirname, '../../../data/l2counties.csv');
    // const l2Cities = path.join(__dirname, '../../../data/l2counties.csv');
    // outFile = fs.createWriteStream(
    //   l2Counties,
    // );

    const { state, type, name } = row;
    if (type === 'County') {
      let countyName = cleanupName(name);
      console.log('checking county', countyName);
      const counties = await County.find({
        name: countyName,
        state: state,
      });
      if (!counties || counties.length === 0) {
        countyCount++;
        console.log('geocoding county', countyName, state);
        const resp = await geocodeLocation(countyName, state, 'county');
        if (resp.success) {
          const postalCodes = resp.postalCodes;
          const county = resp.county;
          console.log('geocoded county', countyName, postalCodes, county);
          // let newCounty = {
          //   name: countyName,
          //   state: state,
          //   postalCodes: postalCodes,
          // };
          // await County.create(newCounty);
        } else {
          console.log('could not geocode county', countyName);
        }
      }
    } else if (type === 'City') {
      let cityName = cleanupName(name);
      console.log('checking city', cityName);
      const cities = await Municipality.find({
        name: cityName,
        state: state,
      });
      if (!cities || cities.length === 0) {
        cityCount++;
        console.log('geocoding city', cityName, state);
        const resp = await geocodeLocation(cityName, state, 'city');
        if (resp.success) {
          const postalCodes = resp.postalCodes;
          const county = resp.county;
          console.log('geocoded city', cityName, postalCodes, county);
          // let newCity = {
          //   name: cityName,
          //   state: state,
          //   county: county,
          //   postalCodes: postalCodes,
          // };
          // await Municipality.create(newCity);
        } else {
          console.log('could not geocode city', cityName);
        }
      }
    }
  } catch (e) {
    console.log('error in locations.js', e);
  }
}
// function matchLocation(component, location, type) {
//   let longNameLower = component.long_name.toLowerCase();
//   let locationLower = location.toLowerCase();
//   let typeLower = type.toLowerCase();
//   let locationTypeLower = locationLower + ' ' + typeLower;
//   if (
//     longNameLower.includes(locationTypeLower) ||
//     longNameLower.includes(locationLower)
//   ) {
//     if (
//       type === 'county' &&
//       component.types.includes('administrative_area_level_2')
//     ) {
//       console.log('found county', location);
//       return true;
//     } else if (
//       type === 'city' &&
//       (component.types.includes('administrative_area_level_3') ||
//         component.types.includes('administrative_area_level_4') ||
//         component.types.includes('administrative_area_level_5'))
//     ) {
//       console.log('found city', location);
//       return true;
//     }
//   } else {
//     return false;
//   }
// }

function matchLocation(components, location, type) {
  let locationLower = location.toLowerCase();
  let typeLower = type.toLowerCase();
  let locationTypeLower = locationLower + ' ' + typeLower;
  if (
    components.filter(
      (c) =>
        c.long_name.toLowerCase().includes(locationTypeLower) ||
        c.long_name.toLowerCase().includes(locationLower),
    ).length > 0
  ) {
    if (
      type === 'county' &&
      components.filter((c) => c.types.includes('administrative_area_level_2'))
        .length > 0
    ) {
      console.log('found county', location);
      return true;
    }
    if (
      type === 'city' &&
      components.filter(
        (c) =>
          c.types.includes('administrative_area_level_3') ||
          c.types.includes('administrative_area_level_4') ||
          c.types.includes('administrative_area_level_5'),
      ).length > 0
    ) {
      console.log('found city', location);
      return true;
    }
  }
  return false;
}

async function geocodeLocation(location, state, type) {
  console.log(`geocoding ${location} as ${type}`);
  let resp = {
    success: false,
    postalCodes: [],
    county: '',
  };
  let results = [];
  try {
    const client = new Client({});
    const response = await client.geocode({
      params: {
        address: `${location}, ${state}, USA`,
        region: 'us',
        language: 'en',
        key: googleApiKey,
      },
      timeout: 5000, // milliseconds
    });
    results = response?.data?.results;
  } catch (e) {
    console.log('error in locations', e);
    return resp;
  }
  if (!results || results.length === 0) {
    console.log('no results for', location);
    return resp;
  }
  console.log('results', results.length);
  let postalCodes = new Set();

  for (const result of results) {
    // print json with nested objects expanded
    console.log(JSON.stringify(result, null, 2));
    // console.log('result', result.formatted_address);
    if (result.address_components && result.address_components.length > 0) {
      let foundMatch = false;
      let foundCounty;
      for (const component of result.address_components) {
        if (matchLocation(component, location, type)) {
          console.log('found match', location);
          console.log('types', component.types);
          foundMatch = true;
        }
        if (component.types.includes('postal_code')) {
          console.log('found postal code', component.long_name);
          postalCodes.add(component.long_name);
        }
        if (
          component.long_name.includes('County') ||
          component.types.includes('administrative_area_level_2')
        ) {
          console.log('found county', component.long_name);
          foundCounty = component.long_name;
        }
      }
      if (foundMatch && foundCounty) {
        // see if we can find more postalCodes
        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;
        console.log('found lat lng', lat, lng);
        let additionalPostalCodes = await getPostalCodes(
          lat,
          lng,
          location,
          type,
        );
        console.log('additionalPostalCodes', additionalPostalCodes);
        for (const code of additionalPostalCodes) {
          postalCodes.add(code);
        }
      }
    }
  }
  return resp;
}

async function getPostalCodes(lat, lng, location, type) {
  console.log('getting postal codes for lat lng', lat, lng);
  let postalCodes = [];
  try {
    const client = new Client({});
    const response = await client.geocode({
      params: {
        latlng: `${lat},${lng}`,
        region: 'us',
        language: 'en',
        key: googleApiKey,
      },
      timeout: 5000, // milliseconds
    });
    let results = response?.data?.results;
    if (!results || results.length === 0) {
      console.log('no results for lat lng', lat, lng);
      return postalCodes;
    }
    for (const result of results) {
      if (result.address_components && result.address_components.length > 0) {
        for (const component of result.address_components) {
          if (matchLocation(component, location, type)) {
            if (component.types.includes('postal_code')) {
              console.log('found postal code', component.long_name);
              postalCodes.push(component.long_name);
            }
          }
        }
      }
    }
  } catch (e) {
    console.log('error in getPostalCodes', e);
  }
  return postalCodes;
}

function toTitleCase(string) {
  return string
    .split(' ')
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function cleanupName(name) {
  name = name.replace(/[^a-zA-Z0-9 ]/g, '');
  name = toTitleCase(name);
  // name = name.replace(' Village', '');
  // name = name.replace(' Township', '');
  name = name.replace(' County', '');
  name = name.replace(' VLG', ' Village');
  name = name.replace(' TWP', ' Township');
  name = name.replace(' City', '');
  name = name.replace(/\(.*\)/, '');
  return name;
}
