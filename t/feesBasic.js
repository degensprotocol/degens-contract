let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "1%",
  actions: [
    { action: 'update-match', cb: (m) => m.graderFee = 1000000000 * 0.01, },

    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'trade', from: 'B', orderIds: [1], amount: 500, },

    { action: 'assert', positions: { A: 832, } },

    { action: 'finalize', price: 100, },

    // floor(832 * .01) = 8, 8/2 = 4
    { action: 'assert', balances: { A: 10491, B: 9501, }, graderBalances: { g1: 4, g2: 0, g3: 4, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "10%",
  actions: [
    { action: 'update-match', cb: (m) => m.graderFee = 1000000000 * 0.1, },

    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'trade', from: 'B', orderIds: [1], amount: 500, },

    { action: 'assert', positions: { A: 832, } },

    { action: 'finalize', price: 100, },

    // floor(832 * .01) = 8, 8/2 = 4
    { action: 'assert', balances: { A: 10416, B: 9501, }, graderBalances: { g1: 41, g2: 0, g3: 42, }, positions: { A: 0, B: 0, } },
  ],
},

]);
