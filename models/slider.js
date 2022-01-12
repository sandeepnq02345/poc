const StateParamsHandler = require('./state-params-handler');
const checkBoxList = require('../models/framework.json').checkBox;
const _ = require('lodash');

/**
 * Slider Class for Filters
 * example: HoA balance
 */
class Slider extends StateParamsHandler {
  /**
   * @param  {Object} df dialogflow object
   * @param  {Object} capturedParameters JSON object of DFCX captured parameters
   */
  constructor (df, capturedParameters) {
    super(df);
    const { predicate, range, operator, action, filterName, filterSchema, filterType } = capturedParameters;
    this.hasRange = !!(range);
    this.isRemove = !!(action);
    if (this.hasRange) {
      this.range = {};
      this.range.value = range.value;
      this.range.min = range.min;
      this.range.max = range.max;
    }
    this.operator = operator;
    this.predicate = predicate;
    this.hasValidationError = false;
    this.filterName = filterName;
    this.filterSchema = filterSchema;
    this.filterType = filterType;
    this.setConfiguration();
    this.currentState = _.get(this.stateParams, this.filterSchema) || this.getDefaultConfig();

    this.validate();
    if (!this.hasValidationError) {
      this.process();
      this.setStateParams();
    }
  }

  /**
   * Validation Function
   */
  validate () {
    try {
      this.validateRemoveAction();
      // this.checkIfAlreadyExists();
      this.IsRemoveOrNoRangeCaptured();
      this.checkIfValidRange();
    } catch (error) {
      this.hasValidationError = true;
    }
  }

  /**
   * Processing functions
   */
  process () {
    this.setPredicate();
    this.setMinMaxRange();
  }

  /**
   * Checks if filter present if the action is 'remove'.
   */
  validateRemoveAction () {
    if (this.isRemove) {
      if (!_.get(this.stateParams, this.filterSchema)) {
        this.responseTemplate = 'invalidRemoveAction';
        throw new Error();
      }
    }
  }

  /**
   * Validates if the filter is already exist or not.
   */
  checkIfAlreadyExists () {
    if (!this.isRemove && !this.hasRange && checkBoxList.includes(this.filterSchema)) {
      if (_.get(this.stateParams, this.filterSchema)) {
        this.responseTemplate = 'criteriaAlreadyApplied';
        throw new Error();
      }
    }
  }

  /**
   * Checks if { min, max } present
   */
  IsRemoveOrNoRangeCaptured () {
    if (!this.hasRange) {
      if (!this.isRemove) this.responseTemplate = 'getRange';
      else {
        this.setSessionParameter('askClearConfirmation', true);
        this.responseTemplate = 'confirmClearFilter';
        this.responseVariables = { filterDisplayName: this.config.sliderDisplayName };
      }
      throw new Error();
    }
  }

  /**
   * Checks if the range is valid
   */
  checkIfValidRange () {
    const sliderRange = this.config.sliderRange;
    if (!((this.range.value && this.isBetween(this.range.value, sliderRange)) ||
    (this.isBetween(this.range.min, sliderRange) && this.isBetween(this.range.max, sliderRange)))) {
      this.responseTemplate = 'rangeValidationError';
      throw new Error();
    }
  }

  /**
   * Checks if the value is between the range specified
   * @param  {number} value
   * @param  {Object} sliderRange
   */
  isBetween (value, sliderRange) {
    const { min: sliderMin, max: sliderMax } = sliderRange;
    return !!(sliderMin <= value && value <= sliderMax);
  }
}

module.exports = { Slider };
