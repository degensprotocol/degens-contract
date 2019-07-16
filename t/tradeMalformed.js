let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "empty array",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },

    { action: 'trade', from: 'A', orderIds: [], amount: 500, expectError: 'DERR_EMPTY_PACKEDORDERS', },
  ],
},

{
  desc: "set taker",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, taker: 'C', },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectError: 'DERR_INVALID_ORDER_SIGNATURE', }, // not DERR_INVALID_TAKER

    { action: 'assert', balances: { A: 10000, B: 10000, C: 10000, }, positions: { A: 0, B: 0, C: 0, } },

    { action: 'trade', from: 'C', orderIds: [1], amount: 500, expectLogs: [['LogTrade']], },

    { action: 'assert', balances: { A: 9667, B: 10000, C: 9501, }, positions: { A: 832, B: 0, C: -832, } },
  ],
},

{
  desc: "self trade",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },

    { action: 'trade', from: 'A', orderIds: [1], amount: 500, expectLogs: [['LogTradeError', 'SELF_TRADE']], },
 
    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "amount malformed",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },

    { action: 'trade', from: 'B', orderIds: [1], amount: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", expectLogs: [['LogTradeError', 'AMOUNT_MALFORMED']], },
    { action: 'trade', from: 'B', orderIds: [1], amount: "0x100000000000000000000000000000000", expectLogs: [['LogTradeError', 'AMOUNT_MALFORMED']], },
    { action: 'trade', from: 'B', orderIds: [1], amount: "0x4000003000000060000000000000000000000000000007FFFFF9B", expectLogs: [['LogTradeError', 'AMOUNT_MALFORMED']], },
 
    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },

    { action: 'trade', from: 'B', orderIds: [1], amount: "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", expectLogs: [['LogTrade']], },

    { action: 'assert', balances: { A: 9000, B: 8500, }, positions: { A: 2500, B: -2500, } },
  ],
},

]);
