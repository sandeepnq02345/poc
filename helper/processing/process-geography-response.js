'use strict';
const _ = require('lodash');

/**
* It processes the zip code, city, county and region of a state.
* @param {Object} userCurrentState - current state of the user.
* @return {String} - geoResponse.
*/
const processGeographyString = (userCurrentState) => {
  let geoResponse = '';
  let zipcode = [];
  let city = [];
  let county = [];
  let region = [];
  for (const geoKey in userCurrentState.geography) {
    switch (geoKey) {
      case 'zipcode':
        zipcode = [...userCurrentState.geography[geoKey]];
        zipcode.unshift('zipcode');
        break;
      case 'city':
        city = [...userCurrentState.geography[geoKey]];
        break;
      case 'county':
        county = [...userCurrentState.geography[geoKey]];
        county = county.map(county => county + ' county');
        break;
      case 'region':
        region = [...userCurrentState.geography[geoKey]];
        region = region.map(region => region + ' area');
        break;
    }
  }
  if (zipcode.length === 1) zipcode = [];
  const geography = [...zipcode, ...city, ...county, ...region] || [];
  if (geography.length > 1) {
    if (zipcode.length === 2 && geography.length === 2) {
      geoResponse = geography.join(',');
      geoResponse = geoResponse.replace(',', ' ');
    } else {
      geography.splice(geography.length - 1, 0, 'and');
      geoResponse = geography.join(',');
      if (!_.isEmpty(zipcode)) geoResponse = geoResponse.replace(',', ' ');
      for (let i = 0; i < 2; i++) {
        geoResponse = geoResponse.split('');
        geoResponse.splice(geoResponse.lastIndexOf(','), 1, ' ');
        geoResponse = geoResponse.join('');
      }
    }
  } else geoResponse = geography.join(',');
  return geoResponse;
};

module.exports = { processGeographyString };
