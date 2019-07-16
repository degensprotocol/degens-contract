let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "malformed",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 60, orderId: 1, },
    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 60, orderId: 2, },
    { action: 'order', from: 'B', amount: 633, dir: 'buy', price: 40, orderId: 3, },

    { action: 'matchOrders', from: 'A', leftOrderId: 1, rightOrderIds: [], expectError: "DERR_EMPTY_PACKEDRIGHTORDERS", },

    { action: 'matchOrders', from: 'A', leftOrderId: 1, rightOrderIds: [1], expectError: "DERR_SAME_MAKER", },
    { action: 'matchOrders', from: 'A', leftOrderId: 1, rightOrderIds: [2], expectError: "DERR_SAME_MAKER", },

    { action: 'matchOrders', from: 'A', leftOrderId: 1, rightOrderIds: [3], expectError: "DERR_SAME_DIRECTION", },

    { action: 'assert', balances: { A: 10000, B: 10000 }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "left order has wrong taker set",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, taker: 'B', },
    { action: 'order', from: 'B', amount: 633, dir: 'sell', price: 40, orderId: 2, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], expectError: "DERR_INVALID_ORDER_SIGNATURE", }, // not DERR_INVALID_TAKER

    { action: 'assert', balances: { A: 10000, B: 10000, C: 10000, }, positions: { A: 0, B: 0, C: 0, } },
  ],
},

{
  desc: "right order has wrong taker set",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'order', from: 'B', amount: 633, dir: 'sell', price: 40, orderId: 2, taker: 'B', },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], expectError: "DERR_INVALID_ORDER_SIGNATURE", }, // not DERR_INVALID_TAKER

    { action: 'assert', balances: { A: 10000, B: 10000, C: 10000, }, positions: { A: 0, B: 0, C: 0, } },
  ],
},

{
  desc: "second right order has wrong taker set",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 2000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'order', from: 'B', amount: 200, dir: 'sell', price: 40, orderId: 2, taker: 'C', },
    { action: 'order', from: 'B', amount: 200, dir: 'sell', price: 40, orderId: 3, taker: 'B', },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2, 3], expectError: "DERR_INVALID_ORDER_SIGNATURE", }, // not DERR_INVALID_TAKER

    { action: 'assert', balances: { A: 10000, B: 10000, C: 10000, }, positions: { A: 0, B: 0, C: 0, } },
  ],
},

]);
