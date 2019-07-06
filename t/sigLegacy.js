let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "legacy signature",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, legacySig: true, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectLogs: [['LogTrade']], },

    { action: 'assert', balances: { A: 9667, B: 9501, }, positions: { A: 832, B: -832, } },
  ],
},

]);
