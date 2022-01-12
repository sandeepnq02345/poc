'use strict';

/**
 * View criteria controller
 * @param {object} df webhook fulfillment object
 * @param {object} sessionInfo df parameters
 */
const config = require('../../../config')();
const _ = require('lodash');
const { stateParams, acronyms } = config;
const { setResponse } = require('../../../helper/setResponse');
const { processGeographyString } = require('../../../helper/processing/process-geography-response');

const criteriaFAQ = async (df, sessionInfo) => {
  const userCurrentState = sessionInfo.userCurrentState || {};
  let response = '';
  const stateParamsKeys = Object.keys(userCurrentState);
  const stateParamsCriteria = stateParams.filter((el) => stateParamsKeys.includes(el));
  for (const key of stateParamsCriteria) {
    response = processString[key](response, userCurrentState);
  }
  response = response.replace(/ \./g, '.');
  response = response.replace(/\.with/g, ' with');
  response = response.replace(/\.along/g, ' along');
  response = response.replace(/\./g, '. ');
  setResponse(df, 'criteriaFAQ', { response: response });
};

const processString = {
  geography: (response, userCurrentState) => {
    const geographyString = processGeographyString(userCurrentState);
    response = response.concat(`The list includes properties in ${geographyString}.`);
    return response;
  },
  propensity: (response, userCurrentState) => {
    const [minPropensity, maxPropensity] = [userCurrentState.propensity.min, userCurrentState.propensity.max];
    response = response.concat(`with propensity to list score set to ${minPropensity} to ${maxPropensity}.`);
    return response;
  },
  property: (response, userCurrentState) => {
    let [minProperty, maxProperty] = [userCurrentState.property.min, userCurrentState.property.max];
    if (maxProperty) maxProperty = (maxProperty < 1000000) ? (maxProperty / 1000).toString() + 'K' : (maxProperty / 1000000).toString() + 'Million';
    if (minProperty) minProperty = (minProperty < 1000000) ? (minProperty / 1000).toString() + 'K' : (minProperty / 1000000).toString() + 'Million';
    if (minProperty && maxProperty) response = response.concat(`The properties are valued between ${minProperty} and ${maxProperty}.`);
    else if (minProperty && !maxProperty) response = response.concat(`The properties are valued greater than ${minProperty}.`);
    else if (!minProperty && maxProperty) response = response.concat(`The properties are valued lesser than ${maxProperty}.`);
    return response;
  },
  equity: (response, userCurrentState) => {
    const [minEquity, maxEquity] = [userCurrentState.equity.min, userCurrentState.equity.max];
    response = response.concat(`Equity value has been set to ${minEquity}% to ${maxEquity}%.`);
    return response;
  },
  ltv: (response, userCurrentState) => {
    const [minLtv, maxLtv] = [userCurrentState.ltv.min, userCurrentState.ltv.max];
    response = response.concat(`LTV value has been set to ${minLtv}% to ${maxLtv}%.`);
    return response;
  },
  risk: (response, userCurrentState) => {
    const risks = Object.keys(userCurrentState.risk);
    for (const riskType of risks) {
      if (userCurrentState.risk[riskType].status === true) {
        const [minRisk, maxRisk] = [userCurrentState.risk[riskType].min, userCurrentState.risk[riskType].max];
        response = response.concat(`${(acronyms.includes(riskType)) ? riskType.toUpperCase() : _.capitalize(riskType)} risk layer is added on the UI with score set to ${minRisk} to ${maxRisk}.`);
      }
    }
    return response;
  },
  transaction_type: (response, userCurrentState) => {
    const transactionTypes = Object.keys(userCurrentState.transaction_type).sort();
    for (const transactionType of transactionTypes) {
      if (userCurrentState.transaction_type[transactionType].status === true) {
        const [startDuration, endDuration] = [userCurrentState.transaction_type[transactionType].start, userCurrentState.transaction_type[transactionType].end];
        if (!startDuration && endDuration) response = response.concat(`${(transactionType === 'foreclosure') ? 'Foreclosed' : 'Preforeclosed'} properties in the last ${endDuration} months are included ${transactionType === 'foreclosure' ? '' : 'as well'}.`);
        else response = response.concat(`${(transactionType === 'foreclosure') ? 'Foreclosed' : 'Preforeclosed'} properties between ${startDuration} to ${endDuration} months are included ${transactionType === 'foreclosure' ? '' : 'as well'}.`);
      }
    }
    return response;
  },
  recent_sales: (response, userCurrentState) => {
    if (userCurrentState.recent_sales === true) {
      response = response.concat('along with recent sales layer turned on.');
    }
    return response;
  }

};

module.exports = criteriaFAQ;
