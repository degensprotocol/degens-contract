let testlib = require('./lib/testlib.js');

testlib.doTests([

{
  desc: "large residual position",
  actions: [
    { action: 'deposit', from: 'A', amount: testlib.toWei("10"), },
    { action: 'deposit', from: 'B', amount: testlib.toWei("10"), },
    { action: 'deposit', from: 'C', amount: testlib.toWei("10"), },

    { action: 'order', from: 'A', amount: testlib.toWei("1"), dir: 'buy', price: 99.99999999, orderId: 1, },
    { action: 'order', from: 'B', amount: testlib.toWei("1"), dir: 'sell', price: 48, orderId: 2, },

    { action: 'trade', from: 'C', orderIds: [2], amount: testlib.toWei('0.466'), },

    //{ action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], dumpLogs: e => [ e.longAmount.toString(), e.shortAmount.toString(), ], },
    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], },
  ],
},

]);
