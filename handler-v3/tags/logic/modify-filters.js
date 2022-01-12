'use strict';

const { CheckBox } = require('../../../models/checkbox');
const { MultiCheckBox } = require('../../../models/multiple-checkbox');
const { Slider } = require('../../../models/slider');
const { InvoluntaryLiens } = require('../../../models/involuntary');
const { DateSlider } = require('../../../models/date-slider');
const { preProcessParams } = require('../../../models/preprocess-entities');
const _ = require('lodash');
const { retryResponseHandler, clearRetryHandlerCount } = require('../../../helper/validation/invalid-input');
const { setResponse } = require('../../../helper/setResponse');
const updateGeography = require('../logic/geography/modify-geography');
const logger = require('../../../lib/logger');

const classesMapping = {
  checkBox: CheckBox,
  multiCheckBox: MultiCheckBox,
  slider: Slider,
  involuntary: InvoluntaryLiens,
  dateSlider: DateSlider
};

const modifyFilters = async (df, sessionInfo) => {
  const intentParameters = df.getIntentParameters();
  const capturedFilters = intentParameters.captured_filters;
  const capturedGeography = intentParameters.location || intentParameters.lien_state;

  if ((!capturedFilters || _.isEmpty(capturedFilters)) && (!capturedGeography || _.isEmpty(capturedGeography))) {
    retryResponseHandler(df);
    return;
  }

  if (capturedFilters && capturedFilters.length > 2) {
    setResponse(df, 'complexQuery');
    return;
  }

  if (capturedGeography) {
    await updateGeography(df, sessionInfo);
  }

  if (!capturedFilters) return;

  const preProcessedData = preProcessParams(df, capturedFilters);

  try {
    for (const [index, filter] of preProcessedData.entries()) {
      const filterClass = new classesMapping[filter.filterType](df, filter);
      if (filterClass.hasValidationError) {
        (filterClass.responseVariables) ? setResponse(df, filterClass.responseTemplate, filterClass.responseVariables)
          : setResponse(df, filterClass.responseTemplate);
      } else {
        df.setParameter('userCurrentState', filterClass.stateParams);
        const processedFilters = sessionInfo.processedFilters || [];
        processedFilters.push(filterClass.filterName);
        df.setParameter('processedFilters', processedFilters);
        setResponse(df, 'modifyFiltersSuccess');
        clearRetryHandlerCount(df);
        const triggerredIntent = df.getIntentDisplayName();
        if (!['capture.range'].includes(triggerredIntent)) {
          capturedFilters.splice(index, 1);
          df.setParameter('captured_filters', capturedFilters);
        }
      }
    }
  } catch (error) {
    logger.log('error', `Error in modifyFilters ${error.stack}`, null, { preProcessedData });
  }
};

module.exports = modifyFilters;
