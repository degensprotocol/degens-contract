let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "funds can be recovered",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, expiryOffset: 30, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectLogs: [['LogTrade']], },

    { action: 'assert', balances: { A: 9667, B: 9501, }, positions: { A: 832, B: -832, } },

    { action: 'recover-funds', from: 'A', expectError: 'DERR_TOO_SOON_TO_RECOVER', },
    { action: 'increase-time', amount: (86400 * 13), },
    { action: 'recover-funds', from: 'A', expectError: 'DERR_TOO_SOON_TO_RECOVER', },
    { action: 'increase-time', amount: (86400 * 2), },
    { action: 'recover-funds', from: 'A', expectLogs: [['LogFinalizeMatch']], },

    { action: 'recover-funds', from: 'A', expectError: 'DERR_MATCH_IS_FINALIZED', },
    //{ action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A')], expectLogs: [['LogClaim']], },

    { action: 'claim-finalized', targets: (c, p) => [c('main'), p('A'), p('B')], expectLogs: [['LogClaim'], ['LogClaim']], },

    { action: 'assert', balances: { A: 9667 + 832/2, B: 9501 + 832/2, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "try to pass in graded sig after recovery",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, expiryOffset: 30, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectLogs: [['LogTrade']], },

    { action: 'assert', balances: { A: 9667, B: 9501, }, positions: { A: 832, B: -832, } },

    { action: 'increase-time', amount: (86400 * 15), },
    { action: 'recover-funds', from: 'A', expectLogs: [['LogFinalizeMatch']], },

    // price of 0 is ignored:
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B')], expectLogs: [['LogClaim'], ['LogClaim']], },

    { action: 'assert', balances: { A: 9667 + 832/2, B: 9501 + 832/2, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "bad cancel price",

  alterMatch: (m) => m.cancelPrice = "1000000001",

  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, expiryOffset: 30, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectLogs: [['LogTrade']], },

    { action: 'increase-time', amount: (86400 * 17), },
    { action: 'recover-funds', from: 'A', expectError: 'DERR_INVALID_CANCELPRICE', },
  ],
},

]);
