'use strict';

const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const ValidationError = require('./validation-error');
const validateV3Request = ajv.compile(require('../schemas/v3-request.json'));

/**
* It validates the request.
* @param {Object} req - request.
* @param {Object} res - response.
* @return {Boolean}
*/
const v3RequestValidator = (req, res) => {
  try {
    if (!validateV3Request(req.body)) { throw new ValidationError(validateV3Request.errors); }
    return true;
  } catch (error) {
    res.status(400).send(error);
  }
};

module.exports = {
  v3RequestValidator
};
