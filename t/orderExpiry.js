let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "unfilled order expired",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, expiryOffset: 300, },

    { action: 'increase-time', amount: 400, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectLogs: [['LogTradeError', 'ORDER_EXPIRED']], },

    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "partially filled order expired",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, expiryOffset: 300, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectLogs: [['LogTrade']], },

    { action: 'assert', balances: { A: 9667, B: 9501, }, positions: { A: 832, B: -832, } },

    { action: 'increase-time', amount: 400, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectLogs: [['LogTradeError', 'ORDER_EXPIRED']], },

    { action: 'assert', balances: { A: 9667, B: 9501, }, positions: { A: 832, B: -832, } },
  ],
},

{
  desc: "order future timestamp allowed",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, timestampOffset: 30, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectLogs: [['LogTrade']], },

    { action: 'assert', balances: { A: 9667, B: 9501, }, positions: { A: 832, B: -832, } },
  ],
},

]);
