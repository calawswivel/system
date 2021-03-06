// All expiry in MINUTES
module.exports = {
  refreshPaths: ['/reports'],

  paths: [
    // list of divisions
    {
      path: '/reports/uber-division',
      method: ['GET', 'POST'],
      expiryMinutes: 1440,
    },

    // metadata
    // {
    // 	pathRegExp: /\/reports\/uber(.*?)\/meta/,
    // 	method: 'GET',
    // 	expiryMinutes: 1440
    // },

    // uber for AdhocTool
    {
      path: '/reports/uber',
      body: 'offset',
      method: 'POST',
      expiryMinutes: 15,
    },

    // uber for Dashboard
    {
      path: '/reports/uber',
      method: ['GET', 'POST'],
      expiryMinutes: 60,
    },

    // shipment-status for Dashboard
    {
      path: '/reports/shipment-status',
      method: ['GET', 'POST'],
      expiryMinutes: 15,
    },

    // alert-details for AdhocTool
    {
      path: '/reports/alert-details',
      method: ['GET', 'POST'],
      expiryMinutes: 5,
    },

    // alerts for Dashboard
    {
      path: '/reports/alerts',
      method: ['GET', 'POST'],
      expiryMinutes: 5,
    },

    // booking-details for AdhocTool
    {
      path: '/reports/booking-details',
      method: ['GET', 'POST'],
      expiryMinutes: 15,
    },

    // FM3K APIs for reports
    {
      pathRegExp: /\/fm3k\/reports/,
      method: 'GET',
      expiryMinutes: 5,
    },
    {
      pathRegExp: /\/fm3k\/report/,
      method: 'POST',
      expiryMinutes: 5,
    },

    // public API for tracking
    {
      path: '/api/bill/search',
      method: 'GET',
      expiryMinutes: 5,
    },

    // workflow
    {
      path: 'workflow/transactionCountsForRole/purchaseOrder',
      method: 'GET',
      expiryMinutes: 15,
    },
    {
      path: 'workflow/transactionCountsForRole/booking',
      method: 'GET',
      expiryMinutes: 15,
    },
  ],
}
