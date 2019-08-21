let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "right order fails",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 60, orderId: 1, expiryOffset: 1000, },
    { action: 'order', from: 'B', amount: 500, dir: 'sell', price: 40, orderId: 2, expiryOffset: 300, },
    { action: 'order', from: 'B', amount: 500, dir: 'sell', price: 30, orderId: 3, expiryOffset: 600, },

    { action: 'increase-time', amount: 400, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], expectLogs: [["LogTradeError", "ORDER_EXPIRED"]], },
    { action: 'assert', balances: { A: 10000, B: 10000 }, positions: { A: 0, B: 0, } },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2, 3], expectLogs: [["LogTradeError", "ORDER_EXPIRED"], ["LogTrade"], ["LogTrade"]], },
    { action: 'assert', balances: { A: 9573, B: 9501, C: 214, }, positions: { A: 712, B: -712, C: 0, } },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2, 3], expectLogs: [["LogTradeError", "ORDER_EXPIRED"], ["LogTradeError", "TAKER_NO_BALANCE"]], },
    { action: 'assert', balances: { A: 9573, B: 9501, C: 214, }, positions: { A: 712, B: -712, C: 0, } },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [3, 2], expectLogs: [["LogTradeError", "TAKER_NO_BALANCE"], ["LogTradeError", "ORDER_EXPIRED"]], },
    { action: 'assert', balances: { A: 9573, B: 9501, C: 214, }, positions: { A: 712, B: -712, C: 0, } },
  ],
},


{
  desc: "2nd right order fails",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 60, orderId: 1, expiryOffset: 1000, },
    { action: 'order', from: 'B', amount: 500, dir: 'sell', price: 40, orderId: 2, expiryOffset: 300, },
    { action: 'order', from: 'B', amount: 500, dir: 'sell', price: 30, orderId: 3, expiryOffset: 600, },

    { action: 'increase-time', amount: 400, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [3, 2], expectLogs: [["LogTrade"], ["LogTrade"], ["LogTradeError", "ORDER_EXPIRED"]], },
    { action: 'assert', balances: { A: 9573, B: 9501, C: 214, }, positions: { A: 712, B: -712, C: 0, } },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [3, 2], expectLogs: [["LogTradeError", "TAKER_NO_BALANCE"], ["LogTradeError", "ORDER_EXPIRED"]], },
    { action: 'assert', balances: { A: 9573, B: 9501, C: 214, }, positions: { A: 712, B: -712, C: 0, } },
  ],
},


{
  desc: "left order expired",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 60, orderId: 1, expiryOffset: 300, },
    { action: 'order', from: 'B', amount: 500, dir: 'sell', price: 40, orderId: 2, expiryOffset: 600, },
    { action: 'order', from: 'B', amount: 500, dir: 'sell', price: 30, orderId: 3, expiryOffset: 600, },

    { action: 'increase-time', amount: 400, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2, 3], expectLogs: [['LogTradeError', 'TAKER_NO_BALANCE'], ['LogTradeError', 'TAKER_NO_BALANCE']], },
    { action: 'assert', balances: { A: 10000, B: 10000 }, positions: { A: 0, B: 0, } },
  ],
},


{
  desc: "left order fails",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 60, orderId: 1, },
    { action: 'order', from: 'B', amount: 500, dir: 'sell', price: 40, orderId: 2, },
    { action: 'order', from: 'B', amount: 500, dir: 'sell', price: 30, orderId: 3, },

    { action: 'matchOrders', from: 'A', leftOrderId: 1, rightOrderIds: [2, 3], expectError: "DERR_LEFT_TRADE_FAIL", },
    { action: 'assert', balances: { A: 10000, B: 10000 }, positions: { A: 0, B: 0, } },
  ],
}
]);
