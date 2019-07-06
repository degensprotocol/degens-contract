let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "simple cancelAll",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },

    { action: 'cancelAll', from: 'A', expectLogs: [['LogCancelAll']] },

    { action: 'trade', from: 'B', orderIds: [1], amount: 2000, expectLogs: [['LogTradeError', 'ORDER_CANCELLED']], },

    { action: 'assert', balances: { A: 10000, B: 10000 }, positions: { A: 0, B: 0, } },
  ],
},

]);
