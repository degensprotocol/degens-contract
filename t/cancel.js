let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "simple cancel",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, orderGroup: '0x1234', },

    { action: 'cancel', from: 'A', orderGroup: '0x1234', amount: 1000, expectLogs: [['LogCancel']], },

    { action: 'trade', from: 'B', orderIds: [1], amount: 2000, expectLogs: [['LogTradeError', 'ORDER_CANCELLED']], },

    { action: 'assert', balances: { A: 10000, B: 10000 }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "wrong sender tries cancel",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, orderGroup: '0x1234', },

    { action: 'cancel', from: 'B', orderGroup: '0x1234', amount: 1000, }, // cancel succeeds, but different fill hash (msg.sender different)

    { action: 'trade', from: 'B', orderIds: [1], amount: 2000, expectLogs: [['LogTrade']], },

    { action: 'assert', balances: { A: 9000, B: 8500 }, positions: { A: 2500, B: -2500, } },
  ],
},

{
  desc: "cancel partially filled",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 5000, dir: 'buy', price: 40, orderId: 1, orderGroup: '0x1234', },

    { action: 'trade', from: 'B', orderIds: [1], amount: 1500, expectLogs: [['LogTrade']], },
    { action: 'assert', balances: { A: 9000, B: 8500 }, positions: { A: 2500, B: -2500, } },

    { action: 'cancel', from: 'A', orderGroup: '0x1234', amount: 5000, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 1500, expectLogs: [['LogTradeError', 'ORDER_CANCELLED']], },
    { action: 'assert', balances: { A: 9000, B: 8500 }, positions: { A: 2500, B: -2500, } },
  ],
},

{
  desc: "two orders with same orderGroup",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, orderGroup: '0x1234', },
    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 2, orderGroup: '0x1234', },

    { action: 'trade', from: 'B', orderIds: [1], amount: 1500, expectLogs: [['LogTrade']], },
    { action: 'assert', balances: { A: 9000, B: 8500 }, positions: { A: 2500, B: -2500, } },

    { action: 'trade', from: 'B', orderIds: [2], amount: 1500, expectLogs: [['LogTradeError', 'ORDER_NO_BALANCE']], },
    { action: 'assert', balances: { A: 9000, B: 8500 }, positions: { A: 2500, B: -2500, } },
  ],
},

{
  desc: "malformed orderGroup",
  actions: [
    { action: 'cancel', from: 'A', orderGroup: '0x1000000000000000000000000', amount: 1000, expectError: 'DERR_BAD_ORDERGROUP', },
  ],
},

]);
