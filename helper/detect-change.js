'use strict';

const _ = require('lodash');

/**
* Checks if state parameter has been changed.
* @param {Object} prevParams - previous parameter.
* @param {Object} currentParams - current parameter.
* @return {Boolean}
*/
const hasStateParamsChanged =
  (prevParams, currentParams) => !_.isEqual(prevParams, currentParams);

module.exports = { hasStateParamsChanged };
