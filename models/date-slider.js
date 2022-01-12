const StateParamsHandler = require('./state-params-handler');

/**
 * Date Slider Class for Filters
 * example: LienOrReleaseRecordingDate
 */
class DateSlider extends StateParamsHandler {
  /**
     * @param  {Object} df dialogflow object
     * @param  {Object} capturedParameters JSON object of DFCX captured parameters
     */
  constructor (df, capturedParameters) {
    super(df);
    const { predicate, dateRange, operator, action, filterName, filterSchema, isLayerAction } = capturedParameters;
    this.hasDateRange = !!(dateRange);
    this.isRemove = !!(action);
    if (this.hasDateRange) {
      this.hasStartAndEndDate = dateRange.endDate && dateRange.startDate;
      this.dateRange = {};
      this.dateRange.startDate = dateRange.startDate;
      this.dateRange.endDate = dateRange.endDate;
    }
    this.operator = operator;
    this.predicate = predicate;
    this.hasValidationError = false;
    this.filterName = filterName;
    this.filterSchema = filterSchema;
    this.isLayerAction = isLayerAction;
    this.setConfiguration();
    this.currentState = this.stateParams[this.filterName] || this.getOneYearDateRange(Date.now());

    this.validate();
    if (!this.hasValidationError) {
      this.process();
      this.setStateParams();
      this.setAssociatedFlag();
    }
  }

  /**
     * Validation Function
     */
  validate () {
    try {
      this.validateRemoveAction();
      this.checkIfAlreadyExists();
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
    this.setDateRange();
  }

  /**
     * Checks if filter present if the action is 'remove'.
     */
  validateRemoveAction () {
    if (this.isRemove) {
      if (!this.stateParams[this.filterName]) {
        this.responseTemplate = 'invalidRemoveAction';
        throw new Error();
      }
    }
  }

  getOneYearDateRange (_date) {
    const endDate = new Date(_date);
    const startDate = new Date(_date);
    startDate.setFullYear(endDate.getFullYear() - 1);
    return {
      startDate,
      endDate
    };
  }

  /**
     * Validates if the filter is already present or not.
     */
  checkIfAlreadyExists () {
    if (!this.isRemove && !this.hasDateRange) {
      if (this.stateParams[this.filterName]) {
        this.responseTemplate = 'criteriaAlreadyApplied';
        throw new Error();
      }
    }
  }

  /**
     * Checks if { startDate, endDate } present
     */
  IsRemoveOrNoRangeCaptured () {
    if (!this.hasDateRange) {
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
    const todaysDate = new Date();
    if (!(this.hasDateRange && this.dateRange.endDate <= todaysDate && this.dateRange.startDate <= todaysDate)) {
      if (this.dateRange.startDate) {
        this.responseTemplate = 'rangeValidationError';
        throw new Error();
      }
    }
  }

  setAssociatedFlag () {
    if (this.config.associatedFlag) {
      const filterSchema = this.config.associatedFlag;
      this.stateParams[filterSchema] = { status: true };
    }
  }
}

module.exports = { DateSlider };
