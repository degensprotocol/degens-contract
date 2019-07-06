let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "take both, fully",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'buy', price: 40, orderId: 2, },

    { action: 'trade', from: 'C', orderIds: [1,2], amount: 8000, expectLogs: [['LogTrade'], ['LogTrade']], },

    { action: 'assert', balances: { A: 9000, B: 9000, C: 7000 }, positions: { A: 2500, B: 2500, C: -5000, } },
  ],
},


{
  desc: "take both, second partial",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'buy', price: 40, orderId: 2, },

    { action: 'trade', from: 'C', orderIds: [1,2], amount: 2000, expectLogs: [['LogTrade'], ['LogTrade']], },

    { action: 'assert', balances: { A: 9000, B: 9667, C: 8001 }, positions: { A: 2500, B: 832, C: -3332, } },
  ],
},


{
  desc: "take both, second partial, third untouched",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },
    { action: 'deposit', from: 'D', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'buy', price: 40, orderId: 2, },
    { action: 'order', from: 'D', amount: 1000, dir: 'buy', price: 40, orderId: 3, },

    { action: 'trade', from: 'C', orderIds: [1,2,3], amount: 2000, expectLogs: [['LogTrade'], ['LogTrade']], },

    { action: 'assert', balances: { A: 9000, B: 9667, C: 8001, D: 10000, }, positions: { A: 2500, B: 832, C: -3332, D: 0, }, },
  ],
},



{
  desc: "different prices",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },
    { action: 'deposit', from: 'D', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 66.66666, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'buy', price: 50, orderId: 2, },
    { action: 'order', from: 'C', amount: 1000, dir: 'buy', price: 25, orderId: 3, },

    { action: 'trade', from: 'D', orderIds: [1,2,3], amount: 2000, expectLogs: [['LogTrade'], ['LogTrade'], ['LogTrade']], },

    { action: 'assert', balances: { A: 9001, B: 9000, C: 9834, D: 8001, }, positions: { A: 1499, B: 2000, C: 665, D: -4164, } },
  ],
},



{
  desc: "one order filled",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },
    { action: 'deposit', from: 'D', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'sell', price: 60, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'sell', price: 65, orderId: 2, },

    { action: 'trade', from: 'C', orderIds: [1], amount: 2000, expectLogs: [['LogTrade']], },
    { action: 'assert', balances: { A: 9000, B: 10000, C: 8500, D: 10000, }, positions: { A: -2500, B: 0, C: 2500, D: 0, } },

    { action: 'trade', from: 'D', orderIds: [1,2], amount: 2000, expectLogs: [['LogTradeError', 'ORDER_NO_BALANCE'], ['LogTrade']], },
    { action: 'assert', balances: { A: 9000, B: 9001, C: 8500, D: 8143, }, positions: { A: -2500, B: -2856, C: 2500, D: 2856, } },
  ],
},



{
  desc: "different directions, net 0",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 50, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'sell', price: 50, orderId: 2, },

    { action: 'trade', from: 'C', orderIds: [1,2], amount: 8000, expectLogs: [['LogTrade'], ['LogTrade']], },

    { action: 'assert', balances: { A: 9000, B: 9000, C: 10000, }, positions: { A: 2000, B: -2000, C: 0, } },
  ],
},


{
  desc: "different directions, net profit",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'sell', price: 48, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'buy', price: 52, orderId: 2, },

    { action: 'trade', from: 'C', orderIds: [1,2], amount: 8000, expectLogs: [['LogTrade'], ['LogTrade']], },

    { action: 'assert', balances: { A: 9001, B: 9001, C: 10076, }, positions: { A: -1922, B: 1922, C: 0, } },
  ],
},


{
  desc: "different directions, net loss",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 47, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'sell', price: 54, orderId: 2, },

    { action: 'trade', from: 'C', orderIds: [1,2], amount: 8000, expectLogs: [['LogTrade'], ['LogTrade']], },

    { action: 'assert', balances: { A: 9001, B: 9001, C: 9825, }, positions: { A: 2126, B: -2173, C: 47, } },
  ],
},


]);
