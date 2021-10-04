let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "corrupted data",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1,
      modPackedOrder: (o) => {
          o[0] = testlib.ethers.utils.hexlify(testlib.ethers.utils.bigNumberify(o[0]).add(1));
      },
    },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectError: 'DERR_INVALID_ORDER_SIGNATURE', },

    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "corrupted sig",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1,
      modPackedOrder: (o) => {
          o[2] = testlib.ethers.utils.hexlify(testlib.ethers.utils.bigNumberify(o[2]).add(1));
      },
    },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectError: 'DERR_INVALID_ORDER_SIGNATURE', },

    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "bad chainId",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, chainId: 2, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectError: 'DERR_INVALID_ORDER_SIGNATURE', },

    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "bad price",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 100, orderId: 1, },
    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectError: 'DERR_INVALID_PRICE', },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 0, orderId: 2, },
    { action: 'trade', from: 'B', orderIds: [2], amount: 500, expectError: 'DERR_INVALID_PRICE', },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 108, orderId: 3, },
    { action: 'trade', from: 'B', orderIds: [3], amount: 500, expectError: 'DERR_INVALID_PRICE', },

    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "bad direction",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'invalid', price: 50, orderId: 1, },
    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectError: 'DERR_INVALID_DIRECTION', },

    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },
  ],
},
]);
