let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "trade on finalized match",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },

    { action: 'finalize', price: 0, },

    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },

    { action: 'trade', from: 'B', orderIds: [1], amount: 1000, expectLogs: [['LogTradeError', 'MATCH_FINALIZED']], },

    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "matchOrders on finalized match",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 60, orderId: 1, },
    { action: 'order', from: 'B', amount: 633, dir: 'sell', price: 40, orderId: 2, },
    { action: 'order', from: 'B', amount: 500, dir: 'sell', price: 45, orderId: 3, },

    { action: 'finalize', price: 100, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], expectLogs: [['LogTradeError', 'MATCH_FINALIZED']], },
    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2,3], expectLogs: [['LogTradeError', 'MATCH_FINALIZED'], ['LogTradeError', 'MATCH_FINALIZED']], },

    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },
  ],
},

]);
