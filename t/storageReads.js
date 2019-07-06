let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "exercise read methods",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'testOrder', orderId: 1, assertAmount: 1000, assertFilled: 0, },
    { action: 'getFilledAmount', orderId: 1, assertAmount: 0, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, },
    { action: 'testOrder', orderId: 1, assertAmount: 667, assertFilled: 333, },
    { action: 'getFilledAmount', orderId: 1, assertAmount: 333, },

    { action: 'getPosition', of: 'A', assertAmount: 832, },
    { action: 'getPosition', of: 'B', assertAmount: -832, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 2000, },
    { action: 'testOrder', orderId: 1, assertAmount: 0, assertFilled: 1000, },

    { action: 'getFinalizedStatus', assert: (r, matchInfo) => {
        if (r[0] !== false) throw("bad finalization state");
        if (r[1] !== 0) throw("bad final price");
        if (r[2] !== 0) throw("bad grader fee");
        if (r[3].length !== 0) throw("bad grader list");
      },
    },

    { action: 'finalize', price: 100, },

    { action: 'getFinalizedStatus', assert: (r, matchInfo) => {
        if (r[0] !== true) throw("bad finalization state");
        if (r[1] !== 1000000000) throw("bad final price");
        if (r[2] !== 2500000) throw("bad grader fee");
        if (r[3].length !== 2) throw("bad grader list");
      },
    },

    { action: 'getCancelTimestamp', of: 'A', assertTimestamp: 0, },
    { action: 'cancelAll', from: 'A', },
    { action: 'getCancelTimestamp', of: 'A', assert: (t) => t > 0, },
  ],
},

{
  desc: "testOrder for cancelled order",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, orderGroup: "0xabcd", },
    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 45, orderId: 2, orderGroup: "0x4321", },
    { action: 'testOrder', orderId: 1, assertAmount: 1000, assertFilled: 0, },
    { action: 'testOrder', orderId: 2, assertAmount: 1000, assertFilled: 0, },

    { action: 'trade', from: 'B', orderIds: [2], amount: 200, },
    { action: 'testOrder', orderId: 2, assertAmount: 837, assertFilled: 163, },

    { action: 'cancel', from: 'A', orderGroup: '0xabcd', amount: 1000, expectLogs: [['LogCancel']], },
    { action: 'cancel', from: 'A', orderGroup: '0x4321', amount: 1000, expectLogs: [['LogCancel']], },

    { action: 'testOrder', orderId: 1, assertAmount: 0, assertFilled: testlib.maxBytes32, },
    { action: 'testOrder', orderId: 2, assertAmount: 0, assertFilled: testlib.maxBytes32, },
  ],
},

]);
