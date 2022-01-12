const { makeApiCall } = require('./api/api-caller');
const logger = require('../lib/logger');
const config = require('../config')();
const { clQueryProcessorApi } = config.api;
const { useCaseMapping } = require('../models/usecase-mapping');

/**
* API function call for multi modal query.
* @param {Object} df - df object from the dialogflow.
* @param {Object} stateParams - parameter of the current state.
* @param {String} userId - ID of the user.
* @param {String} sessionId - session of the user.
*/
const submitMultimodalQuery = async (df, sessionInfo) => {
  const timestamp = new Date().toISOString();
  const { userId, sessionId } = sessionInfo;
  const stateParams = sessionInfo.userCurrentState || {};
  const useCase = sessionInfo['use_case'] || 'liens';
  const apiEndpoint = useCaseMapping.get(useCase);
  const data = {
    userId,
    sessionId,
    stateParams,
    timestamp
  };
  const options = {
    method: 'POST',
    url: `${clQueryProcessorApi}` + `/api/${apiEndpoint}/buildQuery`,
    headers: {
      'x-api-key': `${process.env.QUERY_PROCESSOR_API_KEY}`
    },
    data
  };
  try {
    logger.log('debug', 'ABOUT TO EXECUTE QUERY BUILD REQUEST');
    const result = await makeApiCall(options, 'buildQuery');
    const queryId = result.data.queryId;
    df.setParameter('queryId', queryId);
  } catch (error) {
    logger.log('error', 'error generating query via api', null, error);
  }
};

/**
 * Functions calling the retrieval of cached queries ordered by their timestamp
 * Returns array of cached queries
 *
 * @param {String} userId
 * @returns {Array}
 */
const getPreviousQueries = async (userId) => {
  const options = {
    method: 'GET',
    url: `${clQueryProcessorApi}` + '/api/queryCache/findAllByUsername',
    headers: {
      'x-api-key': `${process.env.QUERY_PROCESSOR_API_KEY}`
    },
    params: {
      username: userId
    }
  };
  try {
    const result = await makeApiCall(options, 'findAllByUsername');
    logger.log('debug', `Previous Queries found for User Id: ${userId}`);
    return result.data;
  } catch (error) {
    logger.log('error', 'error generating query via api', null, error);
    return [];
  }
};

/**
 * Function calling the retrieval of state parameters from a specified queryId
 * Returns 1 State Parameter Object
 *
 * @param {String} queryId
 * @returns stateParameters
 */
const getStateParametersByQueryId = async (queryId) => {
  const options = {
    method: 'GET',
    url: `${clQueryProcessorApi}` + '/api/stateParameterCache/findById',
    headers: {
      'x-api-key': `${process.env.QUERY_PROCESSOR_API_KEY}`
    },
    params: {
      id: queryId
    }
  };
  try {
    const result = await makeApiCall(options, 'findById');
    logger.log('debug', `Session Found for Query ID: ${queryId}`);
    return result.data;
  } catch (error) {
    logger.log('error', 'error generating query via api', null, error);
    return [];
  }
};

/**
 * Function calling the retrieval of state parameters from a specified user id
 * Returns 1 State Parameter Object
 *
 * @param {String} username
 * @returns stateParameters
 */
const getSessionStateByUsername = async (username, sessionId, index) => {
  const options = {
    method: 'GET',
    url: `${clQueryProcessorApi}` + '/api/stateParameterCache/findByUsername',
    headers: {
      'x-api-key': `${process.env.QUERY_PROCESSOR_API_KEY}`
    },
    params: {
      username: username,
      sessionId: sessionId,
      index: index
    }
  };
  try {
    const result = (await makeApiCall(options, 'findByUsername')).data;
    logger.log('debug', `Session Found for User Id: ${username}`);
    return result;
  } catch (error) {
    logger.log('error', 'Error getting state parameters via api', null, error);
    return [];
  }
};

/**
 * Uses aggregation api to resolve statistics
 *
 * @param {object} data
 * @returns response
 */
const resolveStatistics = async (queryId, useCase = 'liens', requestBody) => {
  const apiEndpoint = useCaseMapping.get(useCase);
  const data = {
    queryId: queryId,
    take: 0,
    ...requestBody
  };
  const options = {
    method: 'POST',
    url: `${clQueryProcessorApi}` + `/api/${apiEndpoint}/getAggregation`,
    headers: {
      'x-api-key': `${process.env.QUERY_PROCESSOR_API_KEY}`
    },
    data
  };
  try {
    const result = await makeApiCall(options, 'getAggregation');
    return result.data;
  } catch (error) {
    logger.log('error', 'Error resolving dynamic values via aggreagation API', null, error);
  }
};

/**
 * Get Properties count for a particular queryId
 *
 * @param {String} queryId
 * @returns totalHits
 */
const getPropertiesCount = async (queryId, useCase = 'liens') => {
  const apiEndpoint = useCaseMapping.get(useCase);
  const options = {
    method: 'GET',
    url: `${clQueryProcessorApi}` + `/api/${apiEndpoint}/getQuery`,
    headers: {
      'x-api-key': `${process.env.QUERY_PROCESSOR_API_KEY}`
    },
    params: {
      id: queryId,
      requiredDynamicValues: 'clip',
      take: 0
    }
  };

  try {
    const result = await makeApiCall(options, 'getQuery');
    logger.log('debug', `Property Count Found for Query Id: ${queryId}`);
    return result.data.totalHits.value;
  } catch (error) {
    logger.log('error', 'Error getting state parameters via api', null, error);
    return [];
  }
};

module.exports = {
  submitMultimodalQuery,
  getPreviousQueries,
  getStateParametersByQueryId,
  getSessionStateByUsername,
  resolveStatistics,
  getPropertiesCount
};
