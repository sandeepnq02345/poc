'use strict';

const logger = require('./lib/logger');

if (!process.env.NODE_ENV || process.env.NODE_ENV === 'local') {
  require('dotenv').config();
  logger.log('info', `Running in ${process.env.NODE_ENV || 'local'} environment`);
};

const config = require('./config')();
const databaseConnections = require('./lib/database');
const processRequest = require('./handler-v3');
const { v3RequestValidator } = require('./helper/validation/request-validator');
const authenticate = require('./helper/validation/basic-auth');
const errorHandler = require('./helper/error-handler');

exports.fulfillment = async (req, res) => {
  const services = process.env.SERVICES || [];

  if (config.services.auth.enable) {
    const authenticated = authenticate(req.get('authorization'));
    if (!authenticated) {
      res.status(401).send({ status: 401, message: 'Unauthorized' });
      logger.log('error', 'Invalid Auth Credentials');
      return;
    }
  }

  if (config.services && config.services.database && config.services.database.length) {
    if (!services || !services.database) {
      const connections = await databaseConnections();
      if (connections.types.length === 0) {
        services.databaseEnable = false;
        logger.log('info', `database: ${false}`, null);
      } else {
        services.databaseEnable = true;
        services.database = connections.connection;
        logger.log('info', `database: ${true}`, null);
        logger.log('info', `databaseType(s) : ${connections.types}`, null);
      }
      process.env.SERVICES = services;
    }
  }

  if (!v3RequestValidator(req, res)) {
    logger.log('error', 'Invalid Request Body', 'Req Body', req.body);
    return;
  };

  try {
    await processRequest(req, res, services);
  } catch (error) {
    logger.log('error', 'Internal Server Error', null, error);
    errorHandler(error, req, res);
  }
};
