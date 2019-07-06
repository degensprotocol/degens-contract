let testlib = require('../lib/testlib.js');

let p1 = parseInt(process.env.PRICE1);
let p2 = parseInt(process.env.PRICE2);
let p3 = parseInt(process.env.PRICE3);
let p4 = parseInt(process.env.PRICE4);

testlib.doTests([

{
  desc: "fuzz",
  actions: [
    { action: 'deposit', from: 'A', amount: testlib.toWei("10"), },
    { action: 'deposit', from: 'B', amount: testlib.toWei("10"), },
    { action: 'deposit', from: 'C', amount: testlib.toWei("10"), },

    { action: 'order', from: 'A', amount: testlib.toWei("1"), dir: 'buy', price: p1, orderId: 1, },
    { action: 'order', from: 'A', amount: testlib.toWei("1"), dir: 'sell', price: p2, orderId: 2, },
    { action: 'order', from: 'B', amount: testlib.toWei("1"), dir: 'buy', price: p3, orderId: 3, },
    { action: 'order', from: 'B', amount: testlib.toWei("1"), dir: 'sell', price: p4, orderId: 4, },

    { action: 'trade', from: 'A', orderIds: [parseInt(process.env.TRADE_O1)], amount: testlib.toWei(process.env.TRADE_A1), },
    { action: 'trade', from: 'B', orderIds: [parseInt(process.env.TRADE_O2)], amount: testlib.toWei(process.env.TRADE_A2), },
    { action: 'trade', from: 'C', orderIds: [parseInt(process.env.TRADE_O3)], amount: testlib.toWei(process.env.TRADE_A3), },

    (p1 > p4) ? { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [4], } :
    (p3 > p2) ? { action: 'matchOrders', from: 'C', leftOrderId: 2, rightOrderIds: [3], } :
                undefined,
  ],
},

]);
