'use strict';

module.exports = {
  port: process.env.PORT || 3000,
  logger: {
    piiFields: [],
    maxLogLevel: 'debug'
  },
  fulfillmentConfigV3: {
    enable: true,
    platformsEnabled: ['TEXT']
  },
  staticResponses: {
    requestTag: 'static',
    requestFrequencySec: 1,
    concatFrequencySec: 2
  },
  api: {
    clQueryProcessorApi: 'https://dev-dc-multimodal-queryprocessor.apps.pcfusc1dev.solutions.corelogic.com',
    geoCodingAPI: 'https://maps.googleapis.com/maps/api/geocode/json',
    clGeoCodingAPI: 'https://api-prod.corelogic.com/spatial-api/geocode'
  },
  services: {
    auth: {
      enable: false,
      username: process.env.AUTH_USERNAME,
      password: process.env.AUTH_PASSWORD
    },
    databases: []
  }
};
