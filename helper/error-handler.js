'use strict';

/**
 * Application error handler
 * @param {object} err application error
 * @param {object} req http request
 * @param {object} res http response
 */

const errorHandler = (err, req, res) => {
  const environment = process.env.NODE_ENV || 'development';
  const errObj = {};
  const status = err.status || 500;

  if (res.headersSent) {
    return;
  }

  errObj.stackTrace = (environment === 'development') ? err.stack : undefined;
  errObj.status = status;
  errObj.details = err.details || 'Error details not found';
  errObj.message = err.message || 'Internal server error.';
  res.status(status).json(errObj);
};

module.exports = errorHandler;
