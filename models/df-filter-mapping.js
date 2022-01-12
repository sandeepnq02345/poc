const filterNameMap = new Map();
filterNameMap.set('equity', {
  filterName: 'equity',
  filterSchema: 'estimatedEquity'
});

filterNameMap.set('property', {
  filterName: 'propertyValue',
  filterSchema: 'avmValue'
});

filterNameMap.set('ltv', {
  filterName: 'loanToValue',
  filterSchema: 'estimatedCombinedLoanToValue'
});

filterNameMap.set('involuntary', {
  filterName: 'involuntaryLiens',
  filterSchema: 'lienOrReleaseType.lienType'
});

filterNameMap.set('lienAmount', {
  filterName: 'lienAmount',
  filterSchema: 'lienOrReleaseAmount'
});

filterNameMap.set('lienToValueRatio', {
  filterName: 'lienToValueRatio',
  filterSchema: 'lienToValueRatio'
});

filterNameMap.set('lienDateRange', {
  filterName: 'lienOrReleaseRecordingDate',
  filterSchema: 'lienOrReleaseRecordingDate'
});

filterNameMap.set('foreclosure', {
  filterName: 'foreclosure',
  filterSchema: 'foreclosureExistFlag'
});

filterNameMap.set('foreclosureDate', {
  filterName: 'foreclosureDate',
  filterSchema: 'foreclosureDate'
});

filterNameMap.set('preforeclosure', {
  filterName: 'preforeclosure',
  filterSchema: 'preForeclosureExistFlag'
});

filterNameMap.set('preforeclosureDate', {
  filterName: 'preforeclosureDate',
  filterSchema: 'preForeclosureDate'
});

filterNameMap.set('composite', {
  filterName: 'riskScore',
  filterSchema: 'risk.composite'
});

filterNameMap.set('scs', {
  filterName: 'riskScore',
  filterSchema: 'risk.scs'
});

filterNameMap.set('earthquake', {
  filterName: 'riskScore',
  filterSchema: 'risk.earthquake'
});

filterNameMap.set('wildfire', {
  filterName: 'riskScore',
  filterSchema: 'risk.wildfire'
});

filterNameMap.set('inlandFlood', {
  filterName: 'riskScore',
  filterSchema: 'risk.inlandFlood'
});

filterNameMap.set('winterStorm', {
  filterName: 'riskScore',
  filterSchema: 'risk.winterStorm'
});

filterNameMap.set('stormSurge', {
  filterName: 'riskScore',
  filterSchema: 'risk.stormSurge'
});

filterNameMap.set('hurricaneWind', {
  filterName: 'riskScore',
  filterSchema: 'risk.hurricaneWind'
});

filterNameMap.set('aal.composite', {
  filterName: 'averageAnnualLoss',
  filterSchema: 'loss.composite'
});

filterNameMap.set('aal.scs', {
  filterName: 'averageAnnualLoss',
  filterSchema: 'loss.scs'
});

filterNameMap.set('aal.earthquake', {
  filterName: 'averageAnnualLoss',
  filterSchema: 'loss.earthquake'
});

filterNameMap.set('aal.wildfire', {
  filterName: 'averageAnnualLoss',
  filterSchema: 'loss.wildfire'
});

filterNameMap.set('aal.inlandFlood', {
  filterName: 'averageAnnualLoss',
  filterSchema: 'loss.inlandFlood'
});

filterNameMap.set('aal.winterStorm', {
  filterName: 'averageAnnualLoss',
  filterSchema: 'loss.winterStorm'
});

filterNameMap.set('aal.stormSurge', {
  filterName: 'averageAnnualLoss',
  filterSchema: 'loss.stormSurge'
});

filterNameMap.set('aal.hurricaneWind', {
  filterName: 'averageAnnualLoss',
  filterSchema: 'loss.hurricaneWind'
});

module.exports = { filterNameMap };
