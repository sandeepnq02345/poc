'use strict';

const config = require('../../../../config')();
const { setResponse } = require('../../../../helper/setResponse');
const { modifyEquityLtv } = require('./modify-equity-ltv');
const { modifyRiskScore } = require('./modify-risk-score');
const { modifyPropensityScore } = require('./modify-propensity-score');
const { preprocessGeography, postProcessGeography } = require('../../../../helper/processing/pre-post-process-geo');
const modifyGeography = require('../geography/modify-geography');
const validateFilters = require('../../../../helper/validation/filters-validation');
const { applyRecentSalesLayer } = require('./recent-sales');
const { applyForeclosureLayer } = require('./foreclosure');
const { risks, propensityIntentsFAQ, wordsPreventingRemoval } = config;
const _ = require('lodash');
const { setInvalidInputCount } = require('../../../../helper/validation/invalid-input');
const { populateState } = require('../../../../helper/geography/populate-state');

const modifyPropertyFilters = async (df, sessionInfo) => {
  let firstPropertyValueFilter = false;
  let firstForeclosureLayer = false;
  let firstPreForeclosureLayer = false;
  let firstRiskLayer = false;
  const capturedFilters = _.cloneDeep(sessionInfo.captured_filters);

  if (!capturedFilters || (capturedFilters && _.isEmpty(capturedFilters))) {
    df.setParameter('customerActions', null);
    setInvalidInputCount(df, 'filter', 'invalidInputInitial');
    return;
  }

  const modifyFilters = capturedFilters.map((filter) => {
    filter.modify_filters.predicate = filter.predicate || 'and';
    return filter.modify_filters;
  });

  if (!sessionInfo.userCurrentState) {
    sessionInfo.userCurrentState = {};
  }
  let bypassConfirmation = false;
  if (modifyFilters && (modifyFilters.length > 1 ||
    (modifyFilters.length > 0 && sessionInfo && ((sessionInfo.location && sessionInfo.location.length > 0))))) {
    bypassConfirmation = true;
  }
  await processGeography(df, sessionInfo, modifyFilters);
  const checkIfMultipleRisks = modifyFilters.filter(filter => risks.includes(filter.risk_type));
  if (checkIfMultipleRisks.length > 1) {
    setResponse(df, 'multipleRisks', { name: sessionInfo['given-name'] });
    return;
  }

  const checkForContext = modifyFilters.filter((filter) => filter.risk_type === 'score')[0];
  if (checkForContext && checkForContext.mapping && propensityIntentsFAQ.includes(sessionInfo.context)) {
    const index = _.findIndex(modifyFilters, checkForContext);
    modifyFilters.splice(index, 1);
    delete checkForContext.risk_type;
    checkForContext.filters = 'propensity';
    modifyFilters.push(checkForContext);
  }
  let isValid = true;

  // Remove functionality: Multiple filters at the same time
  let filtersToBeRemoved = [];
  filtersToBeRemoved = modifyFilters.filter((filter) => filter.remove);
  if (!_.isEmpty(filtersToBeRemoved)) {
    const userUtterance = df.getUserUtterance();
    if (!wordsPreventingRemoval.some((word) => userUtterance.includes(word))) {
      modifyFilters.map((filter) => { filter.remove = 'remove'; });
    }
  }

  for (const filter of modifyFilters) {
    const payload = {};
    let result = {};
    const filterType = filter.filters;
    const layerType = filter.recent_sales || filter.transaction_type || filter.risk_type;
    if (layerType) {
      switch (layerType) {
        case 'recent sales':
          result = await applyRecentSalesLayer(df, sessionInfo, filter);
          if (result.isValid) {
            df.setParameter('userCurrentState', result.userCurrentState);
            (result.response === undefined) ? setResponse(df, 'recentSalesModified') : setResponse(df, result.response, result.responseParams);
          } else {
            if (result.response !== undefined) { (result.responseParams) ? setResponse(df, result.response, result.responseParams) : setResponse(df, result.response); }
          }
          break;
        case 'foreclosure':
        case 'preforeclosure':
          result = await applyForeclosureLayer(df, sessionInfo, filter);
          if (layerType === 'foreclosure') {
            if (!sessionInfo.foreclosureCaptured && result.isValid) {
              firstForeclosureLayer = true;
              df.setParameter('foreclosureCaptured', true);
            }
          } else {
            if (!sessionInfo.preForeclosureCaptured && result.isValid) {
              firstPreForeclosureLayer = true;
              df.setParameter('preForeclosureCaptured', true);
            }
          }
          if (result.isValid) {
            if ((firstForeclosureLayer || firstPreForeclosureLayer)) {
              setResponse(df, 'firstTransactionTypeModified', { transaction_type: layerType });
            } else {
              (result.response !== undefined) ? setResponse(df, result.response, result.responseParams) : setResponse(df, 'transactionTypeModified');
            }
          } else {
            if (result.response !== undefined) { (result.responseParams) ? setResponse(df, result.response, result.responseParams) : setResponse(df, result.response); }
          }
          break;

        case 'risk':
        case 'scs':
        case 'composite':
        case 'score':
          result = await modifyRiskScore(df, sessionInfo, filter);
          isValid = result.isValid;
          if (!sessionInfo.riskTypeCaptured && isValid) {
            firstRiskLayer = true;
            df.setParameter('riskTypeCaptured', true);
          };
          if (isValid) {
            if (result.payload) payload[Object.keys(result.payload)[0]] = result.payload[Object.keys(result.payload)[0]] || {};
            if (firstRiskLayer) {
              setResponse(df, 'riskLayerUpdated', {
                averageRiskScore: Math.floor(Math.random() * 100) + 1,
                risk: Object.keys(result.payload)[0]
              });
            } else {
              (result.response) ? setResponse(df, result.response, result.responseParams) : setResponse(df, 'riskLayerUpdatedRandom', { risk: Object.keys(result.payload)[0], averageRiskScore: Math.floor(Math.random() * 100) + 1 });
            }
          } else {
            if (result.response !== undefined) { (result.responseParams) ? setResponse(df, result.response, result.responseParams) : setResponse(df, result.response); }
          }
          break;

        default:
          df.setPayload({
            case: `Case not handled for layer ${layerType}`
          });
          break;
      }
      df.setParameter('modify_filters', null);
    } else {
      result = await validateFilters(df, filter, filterType, sessionInfo, modifyFilters.length, bypassConfirmation);
      if (result.processOtherParams) {
        (result.responseParams) ? setResponse(df, result.response, result.responseParams) : setResponse(df, result.response, result.responseParams);
        continue;
      }
      if (!result.isValid) {
        (result.responseParams) ? setResponse(df, result.response, result.responseParams) : setResponse(df, result.response, result.responseParams);
        return;
      }

      switch (filterType) {
        case 'property':
        case 'equity':
        case 'ltv':
          result = await modifyEquityLtv(df, sessionInfo, filter);
          isValid = result.isValid;
          if (!isValid) {
            if (result.response !== undefined) { (result.responseParams) ? setResponse(df, result.response, result.responseParams) : setResponse(df, result.response); }
            break;
          }
          if (!sessionInfo.propertyValueCaptured && filterType === 'property' && isValid) {
            firstPropertyValueFilter = true;
            df.setParameter('propertyValueCaptured', true);
          };
          if (result.payload) payload[Object.keys(result.payload)[0]] = result.payload[Object.keys(result.payload)[0]];
          if (firstPropertyValueFilter && payload.property) {
            const responseParameters = {
              propertiesCount: Math.floor(Math.random() * 1000) + 1,
              minPropertyValue: (payload.property.min < 1000000) ? (payload.property.min / 1000).toString() + 'K' : (payload.property.min / 1000000).toString() + ' Million',
              maxPropertyValue: (payload.property.max < 1000000) ? (payload.property.max / 1000).toString() + 'K' : (payload.property.max / 1000000).toString() + ' Million',
              medianPropertyValue: 'medianValue'
            };
            if (payload.property.min && payload.property.max) {
              setResponse(df, 'firstPropertyValueRange', responseParameters);
            } else if (!payload.property.max) {
              setResponse(df, 'firstPropertyValueGt', responseParameters);
            } else if (!payload.property.min) {
              setResponse(df, 'firstPropertyValueLt', responseParameters);
            }
          } else if (isValid) {
            setResponse(df, 'modifyFilters', { propertiesCount: Math.floor(Math.random() * 1000) + 1 });
          }
          break;

        case 'propensity':
          result = await modifyPropensityScore(df, sessionInfo, filter);
          isValid = result.isValid;
          if (isValid) {
            if (result.payload) payload[Object.keys(result.payload)[0]] = result.payload[Object.keys(result.payload)[0]] || {};
            (result.response) ? setResponse(df, result.response, result.responseParams) : setResponse(df, 'modifyFilters', { propertiesCount: Math.floor(Math.random() * 1000) + 1 });
          } else {
            if (result.response !== undefined) { (result.responseParams) ? setResponse(df, result.response, result.responseParams) : setResponse(df, result.response); }
          }
          break;

        default:
          df.setPayload({
            case: `Case not handled for filter ${filterType}`
          });
          break;
      }
      if (result.isValid) {
        df.setParameter('modify_filters', null);
      }
    }
  };
};

const processGeography = async (df, sessionInfo, modifyFilters) => {
  // Check if no location/region object is captured in request
  // TODO: Check location inside of IntentParams rather than SessionParams
  const intentParams = df.getIntentParameters();
  const hasGeography = !!intentParams.location;
  if (!hasGeography) {
    return;
  }
  const customerActions = sessionInfo.user_actions;
  sessionInfo = await preprocessGeography(sessionInfo);
  const checkIfRecentSales = modifyFilters.filter(filter => filter.recent_sales);
  if (checkIfRecentSales && checkIfRecentSales[0] && !checkIfRecentSales[0].remove && (!customerActions || (customerActions && customerActions.length === 0))) {
    const currentGeographies = _.cloneDeep(sessionInfo.userCurrentState.geography) || {};
    const capturedGeographies = _.cloneDeep(sessionInfo.geography.location);
    let inSelectedGeo = true;
    for (const capturedGeo of capturedGeographies) {
      const types = Object.keys(capturedGeo);
      for (const type of types) {
        currentGeographies[type] = currentGeographies[types] || [];
        inSelectedGeo = currentGeographies[type].indexOf(capturedGeo[type]) !== -1;
        if (!inSelectedGeo) break;
      }
      if (!inSelectedGeo) break;
    }
    if (!inSelectedGeo) {
      sessionInfo.userCurrentState.recent_sales = true;
      df.setParameter('changeGeoConfirmation', true);
      setResponse(df, 'geographyChange', { name: sessionInfo['given-name'] });
      const index = _.findIndex(modifyFilters, checkIfRecentSales[0]);
      modifyFilters.splice(index, 1);
      return;
    } else {
      sessionInfo.userCurrentState.recent_sales = false;
    }
  }
  if (!customerActions || (customerActions && customerActions.length === 0)) {
    sessionInfo = postProcessGeography(sessionInfo);
    sessionInfo.userCurrentState = await populateState(sessionInfo, true);
    df.setParameter('currentZipAndRegions', null);
    df.setParameter('userCurrentState', sessionInfo.userCurrentState);
    df.setParameter('location', null);
    df.setParameter('geography', null);
    return;
  }
  return modifyGeography(df, sessionInfo);
};

module.exports = modifyPropertyFilters;
