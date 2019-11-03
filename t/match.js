let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "simple match buy+/sell",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 60, orderId: 1, },
    { action: 'order', from: 'B', amount: 633, dir: 'sell', price: 40, orderId: 2, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2],
      expectLogs: [
        ['LogTrade', (l, addrs) => {
            if (l.args.takerAccount !== addrs.C) throw(`unexpected taker in log`);
            if (l.args.makerAccount !== addrs.B) throw(`unexpected maker in log`);
        }],
        ['LogTrade', (l, addrs) => {
            if (l.args.takerAccount !== addrs.C) throw(`unexpected taker in log`);
            if (l.args.makerAccount !== addrs.A) throw(`unexpected maker in log`);
        }],
      ],
    },

    { action: 'assert', balances: { A: 10000-633, B: 10000-633, C: 211 },
                        positions: { A: 633 + (633*40/60), B: -(633 + (633*40/60)), C: 0 } },
  ],
},


{
  desc: "simple match buy/sell+",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 633, dir: 'buy', price: 60, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'sell', price: 40, orderId: 2, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], },

    { action: 'assert', balances: { A: 10000-633, B: 10000-633, C: 211 },
                        positions: { A: 633 + (633*40/60), B: -(633 + (633*40/60)), C: 0 } },
  ],
},


{
  desc: "simple match sell+/buy",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'sell', price: 40, orderId: 1, },
    { action: 'order', from: 'B', amount: 633, dir: 'buy', price: 60, orderId: 2, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], },

    { action: 'assert', balances: { A: 10000-633, B: 10000-633, C: 211 },
                        positions: { B: 633 + (633*40/60), A: -(633 + (633*40/60)), C: 0 } },
  ],
},


{
  desc: "simple match sell/buy+",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 633, dir: 'sell', price: 40, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'buy', price: 60, orderId: 2, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], },

    { action: 'assert', balances: { A: 10000-633, B: 10000-633, C: 211 },
                        positions: { B: 633 + (633*40/60), A: -(633 + (633*40/60)), C: 0 } },
  ],
},


{
  desc: "rounding problem match",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 51, orderId: 1, },
    { action: 'order', from: 'B', amount: 633, dir: 'sell', price: 49, orderId: 2, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], },

    { action: 'assert', balances: { A: 9368, B: 9368, C: 24 }, positions: { A: 1240, B: -1239, C: -1 } },
  ],
},


{
  desc: "double rounding problem match",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'order', from: 'A', amount: 1000, dir: 'sell', price: 60, orderId: 2, },

    { action: 'order', from: 'B', amount: 1000, dir: 'buy', price: 25, orderId: 3, },
    { action: 'order', from: 'B', amount: 1000, dir: 'sell', price: 35, orderId: 4, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 200, },
    { action: 'trade', from: 'C', orderIds: [1], amount: 200, },

    { action: 'assert', balances: { A: 9734, B: 9801, C: 9801 }, positions: { A: 664, B: -332, C: -332, } },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [4], },

    { action: 'assert', balances: { A: 9120, B: 8802, C: 9879, }, positions: { A: 2199, B: -1869, C: -330, } },
  ],
},


{
  desc: "try to match cancelled left order",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 60, orderId: 1, orderGroup: "0x1234", },
    { action: 'order', from: 'B', amount: 633, dir: 'sell', price: 40, orderId: 2, },

    { action: 'cancel', from: 'A', orderGroup: '0x1234', amount: 1000, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], expectLogs: [['LogTradeError', 'TAKER_NO_BALANCE']], }, // because right order is traded first, and taker has 0 balance

    { action: 'assert', balances: { A: 10000, B: 10000, C: 0, }, positions: { A: 0, B: 0, C: 0, } },
  ],
},

{
  desc: "try to match cancelled right order",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 60, orderId: 1, },
    { action: 'order', from: 'B', amount: 633, dir: 'sell', price: 40, orderId: 2, orderGroup: "0x1234", },

    { action: 'cancel', from: 'B', orderGroup: '0x1234', amount: 633, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], expectLogs: [['LogTradeError', 'ORDER_CANCELLED']], },

    { action: 'assert', balances: { A: 10000, B: 10000, C: 0, }, positions: { A: 0, B: 0, C: 0, } },
  ],
},

{
  desc: "negative return from matchOrders",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'sell', price: 75, orderId: 2, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], expectLogs: [['LogTrade'], ['LogTrade']], },

    { action: 'assert', balances: { A: 9000, B: 9375, C: 9125, }, positions: { A: 2500, B: -2500, C: 0, } },
  ],
},


{
  desc: "negative return from matchOrders, matcher has insufficient balance",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'sell', price: 75, orderId: 2, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2], expectError: 'revert', }, // testToken doesn't give nice error messages

    { action: 'assert', balances: { A: 10000, B: 10000, C: 0, }, positions: { A: 0, B: 0, C: 0, } },
  ],
},


{
  desc: "left trade needs to be applied first in matchOrders so balance doesn't go negative",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'order', from: 'A', amount: 1000, dir: 'sell', price: 60, orderId: 2, },

    { action: 'order', from: 'B', amount: 1000, dir: 'buy', price: 25, orderId: 3, },
    { action: 'order', from: 'B', amount: 1000, dir: 'sell', price: 35, orderId: 4, },

    { action: 'trade', from: 'B', orderIds: [2], amount: 800, },
    { action: 'trade', from: 'C', orderIds: [1], amount: 800, },

    { action: 'assert', balances: { A: 10266, B: 9201, C: 9201 }, positions: { A: 0, B: 1332, C: -1332, } },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [4],
      expectLogs: [
        ['LogTrade', (l, addrs) => {
            if (l.args.takerAccount !== addrs.C) throw(`unexpected taker in log`);
            if (l.args.makerAccount !== addrs.B) throw(`unexpected maker in log`);
        }],
        ['LogTrade', (l, addrs) => {
            if (l.args.takerAccount !== addrs.C) throw(`unexpected taker in log`);
            if (l.args.makerAccount !== addrs.A) throw(`unexpected maker in log`);
        }],
      ],
    },

    { action: 'assert', balances: { A: 9800, B: 9608, C: 9260, }, positions: { A: 1165, B: 167, C: -1332, } },
  ],
},


{
  desc: "multi matchOrders",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 10000, dir: 'buy', price: 45, orderId: 1, },
    { action: 'order', from: 'B', amount: 1000, dir: 'sell', price: 35, orderId: 2, },
    { action: 'order', from: 'B', amount: 2000, dir: 'sell', price: 35, orderId: 3, },

    { action: 'matchOrders', from: 'C', leftOrderId: 1, rightOrderIds: [2, 3],
      expectLogs: [
        ['LogTrade', (l, addrs) => {
            if (l.args.takerAccount !== addrs.C) throw(`unexpected taker in log`);
            if (l.args.makerAccount !== addrs.B) throw(`unexpected maker in log`);
        }],
        ['LogTrade', (l, addrs) => {
            if (l.args.takerAccount !== addrs.C) throw(`unexpected taker in log`);
            if (l.args.makerAccount !== addrs.A) throw(`unexpected maker in log`);
        }],

        ['LogTrade', (l, addrs) => {
            if (l.args.takerAccount !== addrs.C) throw(`unexpected taker in log`);
            if (l.args.makerAccount !== addrs.B) throw(`unexpected maker in log`);
        }],
        ['LogTrade', (l, addrs) => {
            if (l.args.takerAccount !== addrs.C) throw(`unexpected taker in log`);
            if (l.args.makerAccount !== addrs.A) throw(`unexpected maker in log`);
        }],
      ],
    },

    { action: 'assert', balances: { A: 7926, B: 7003, C: 10461, }, positions: { A: 4610, B: -4609, C: -1, } },
  ],
},


]);
