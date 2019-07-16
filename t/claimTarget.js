let testlib = require('./lib/testlib.js');


testlib.testTemplate({
  pre: [
    { action: 'update-match', cb: (m) => m.graderFee = '0', },

    // Main token

    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'trade', from: 'B', orderIds: [1], amount: 500, },

    { action: 'assert', balances: { A: 9667, B: 9501, C: 10000 }, positions: { A: 832, B: -832, C: 0 } },

    { action: 'order', from: 'A', amount: 333, dir: 'sell', price: 60, orderId: 2, },
    { action: 'trade', from: 'C', orderIds: [2], amount: 1000, },

    { action: 'assert', balances: { A: 10166, B: 9501, C: 9501 }, positions: { A: 0, B: -832, C: 832 } },

    { action: 'order', from: 'A', amount: 333, dir: 'sell', price: 60, orderId: 3, },
    { action: 'trade', from: 'C', orderIds: [3], amount: 1000, },

    // alt token

    { action: 'new-token', name: 'alt', },
    { action: 'deposit', from: 'A', amount: 10000, token: 'alt', },
    { action: 'deposit', from: 'B', amount: 10000, token: 'alt', },
    { action: 'deposit', from: 'C', amount: 10000, token: 'alt', },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 50, orderId: 4, token: 'alt', },
    { action: 'trade', from: 'B', orderIds: [4], amount: 300, },
    { action: 'trade', from: 'C', orderIds: [4], amount: 200, },


    { action: 'assert', balances: { A: 9834, B: 9501, C: 9002 }, positions: { A: -831, B: -832, C: 1663 } },
    { action: 'assert', token: 'alt', balances: { A: 9500, B: 9700, C: 9800 }, positions: { A: 1000, B: -600, C: -400 }, },

    { action: 'disable-invariant-checking', },
  ],

  post: [
    { action: 'enable-invariant-checking', },

    { action: 'assert', balances: { A: 10665, B: 10333, C: 9002 }, positions: { A: 0, B: 0, C: 0 } },
    { action: 'assert', token: 'alt', balances: { A: 9500, B: 10300, C: 10200 }, positions: { A: 0, B: 0, C: 0 }, },
  ],
})


.test({
  desc: 'mixed',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A')], },
    { action: 'assert', balances: { A: 10665, B: 9501, C: 9002 }, positions: { A: 0, B: -832, C: 1663 } },

    { action: 'claim-finalized', targets: (c, p) => [c('main'), p('B'), p('C')], },
    { action: 'assert', balances: { A: 10665, B: 10333, C: 9002 }, positions: { A: 0, B: 0, C: 0 } },

    // alt token still untouched

    { action: 'assert', token: 'alt', balances: { A: 9500, B: 9700, C: 9800 }, positions: { A: 1000, B: -600, C: -400 }, },

    { action: 'claim-finalized', targets: (c, p) => [c('alt'), p('B'), p('C')], },
    { action: 'assert', token: 'alt', balances: { A: 9500, B: 10300, C: 10200 }, positions: { A: 1000, B: 0, C: 0 }, },

    { action: 'claim-finalized', targets: (c, p) => [c('alt'), p('B'), p('A'), p('C')], },
    { action: 'assert', token: 'alt', balances: { A: 9500, B: 10300, C: 10200 }, positions: { A: 0, B: 0, C: 0 }, },
  ],
})


.test({
  desc: 'everything at once',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'),
                                                        c('alt'), p('A'), p('B'), p('C')
                                                       ], },
  ],
})


.test({
  desc: 'none',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [], },

    { action: 'assert', balances: { A: 9834, B: 9501, C: 9002 }, positions: { A: -831, B: -832, C: 1663 } },
    { action: 'assert', token: 'alt', balances: { A: 9500, B: 9700, C: 9800 }, positions: { A: 1000, B: -600, C: -400 }, },

    { action: 'claim-finalized', targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), c('alt'), p('A'), p('B'), p('C') ], },
  ],
})

.test({
  desc: 'complex target',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('alt'), p('B'),
                                                        c('main'), p('C'), '0x0', // null addr
                                                        c('alt'), p('A'), p('C'),
                                                        c('main'), p('A'), p('A'), // duplicate
                                                        c('alt'), // empty
                                                        c('main'), p('B'),
                                                       ], },
  ],
})


.test({
  desc: 'logs and errors',
  actions: [
    { action: 'claim-finalized', targets: (c, p) => [c('main'), p('B'), p('C')], expectError: 'DERR_MATCH_NOT_FINALIZED', },

    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), c('alt'), p('A')], expectLogs: [['LogFinalizeMatch'], ['LogClaim'], ['LogClaim']], },

    { action: 'claim-finalized', targets: (c, p) => [c('main'), p('B'), p('C'), c('alt'), p('B'), p('C')], expectLogs: [['LogClaim'], ['LogClaim'], ['LogClaim'], ['LogClaim']] },
  ],
})


.run();
