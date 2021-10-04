let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "gas tests",
  actions: [
    { action: 'update-match', cb: (m) => m.graderFee = '0', },

    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },
    { action: 'deposit', from: 'D', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'order', from: 'A', amount: 1000, dir: 'sell', price: 60, orderId: 2, },
    { action: 'trade', from: 'B', orderIds: [1], amount: 200, },
    { action: 'trade', from: 'C', orderIds: [1], amount: 200, },
    { action: 'trade', from: 'D', orderIds: [2], amount: 200, },

    { action: 'disable-invariant-checking', },

    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('D'), p('B'), p('C')], },
    //{ action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), p('D')], },
    { action: 'claim-finalized', targets: (c, p) => [c('main'), p('B'), p('C'), p('D')], },

    { action: 'enable-invariant-checking', },
  ],
},

]);
