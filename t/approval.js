let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "maker has lower approval than balance",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, approve: 1000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 5000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'trade', from: 'B', orderIds: [1], amount: 2000, },

    { action: 'assert', balances: { A: 9000, B: 8500, }, positions: { A: 2500, B: -2500, } },

    { action: 'finalize', price: 0, },

    { action: 'assert', balances: { A: 9000, B: 10994, }, positions: { A: 0, B: 0, C: 0 } },
  ],
},

{
  desc: "taker has lower approval than balance",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, approve: 500 },

    { action: 'order', from: 'A', amount: 5000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'trade', from: 'B', orderIds: [1], amount: 2000, },

    { action: 'assert', balances: { A: 9667, B: 9501, }, positions: { A: 832, B: -832, } },

    { action: 'finalize', price: 0, },

    { action: 'assert', balances: { A: 9667, B: 10331, }, positions: { A: 0, B: 0, C: 0 } },
  ],
},

]);
