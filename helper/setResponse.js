'use strict';

const _ = require('lodash');
const template = require('lodash.template');
const messageSkeleton = require('../data/responses');
const logger = require('../lib/logger');
const { acknowledgePrefix } = require('../config')();
const { resolveStaticParameters } = require('../helper/resolve-interpolated-delimiters');

module.exports.setResponse = (df, key, values) => {
  let responseMessage;
  if (!values) {
    values = {};
  }
  const randomPrefix = acknowledgePrefix[Math.floor(Math.random() * acknowledgePrefix.length)];
  values.ackPrefix = randomPrefix;
  const _messageSkeleton = _.cloneDeep(messageSkeleton);
  if (key) {
    let response = '';
    if (_messageSkeleton[key].response.length > 0) {
      response = _messageSkeleton[key].response[Math.floor(Math.random() * _messageSkeleton[key].response.length)];
    } else {
      response = _messageSkeleton[key].response[0];
    }
    const restoredTemplate = resolveStaticParameters(response, values);
    df.setTemplateResponse(restoredTemplate);
    const compiled = template(response);
    responseMessage = compiled(values);
  }
  if (!responseMessage) {
    responseMessage = 'Error while compiling response';
    logger.log('error', `Error to compile response for key: ${key}`);
  }
  _messageSkeleton[key].compiledResponse = responseMessage;
  df.setResponseKey(_messageSkeleton[key].type, _messageSkeleton[key], key);
  df.setResponseText(responseMessage);
};
