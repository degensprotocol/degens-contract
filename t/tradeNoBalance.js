let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "taker no balance",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 0, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectLogs: [['LogTradeError', 'TAKER_NO_BALANCE']], },

    { action: 'assert', balances: { A: 10000, B: 0, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "order no balance, maker has 0 balance",
  actions: [
    { action: 'deposit', from: 'A', amount: 0, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectLogs: [['LogTradeError', 'ORDER_NO_BALANCE']], },

    { action: 'assert', balances: { A: 0, B: 10000, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "trade too small",
  actions: [
    { action: 'deposit', from: 'A', amount: 5, },
    { action: 'deposit', from: 'B', amount: 5, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 1, orderId: 1, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectLogs: [['LogTradeError', 'TRADE_TOO_SMALL']], },

    { action: 'assert', balances: { A: 5, B: 5, }, positions: { A: 0, B: 0, } },
  ],
},

]);
