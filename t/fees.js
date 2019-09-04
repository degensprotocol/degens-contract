let testlib = require('./lib/testlib.js');


testlib.testTemplate({
  pre: [
    { action: 'update-match', cb: (m) => m.graderFee = '2500000', },

    { action: 'deposit', from: 'A', amount: 10000000, },
    { action: 'deposit', from: 'B', amount: 10000000, },
    { action: 'deposit', from: 'C', amount: 10000000, },

    { action: 'order', from: 'A', amount: 1000000, dir: 'sell', price: 42, orderId: 1, },
    { action: 'trade', from: 'B', orderIds: [1], amount: 800000, },

    { action: 'assert', balances: { A: 9000001, B: 9275863, C: 10000000 }, positions: { A: -1724136, B: 1724136, C: 0 } },

    { action: 'order', from: 'A', amount: 3333333, dir: 'sell', price: 65, orderId: 2, },
    { action: 'trade', from: 'C', orderIds: [2], amount: 1555555, },

    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },

    { action: 'disable-invariant-checking', },
  ],

  post: [
    { action: 'enable-invariant-checking', },
  ],
})


.test({
  desc: 'just full winner',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A')], },

    // 8162395 + (4117296 * .9975) = 12269397.7600  (fee rounding always in customer favour)
    // 4117296 * .0025 / 2 = 5146.62
    { action: 'assert', balances: { A: 12269398, B: 9275863, C: 8444446 }, graderBalances: { g1: 5146, g2: 0, g3: 5147 }, positions: { A: 0, B: 1724136, C: 2393160 } },

    { action: 'claim-finalized', targets: (c, p) => [c('main'), p('B'), p('C')], },
    { action: 'assert', balances: { A: 12269398, B: 9275863, C: 8444446 }, graderBalances: { g1: 5146, g2: 0, g3: 5147 }, positions: { A: 0, B: 0, C: 0 } },
  ],
})


.test({
  desc: 'everyone',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ], },
    { action: 'assert', balances: { A: 12269398, B: 9275863, C: 8444446 }, graderBalances: { g1: 5146, g2: 0, g3: 5147 }, positions: { A: 0, B: 0, C: 0 } },
  ],
})



.test({
  desc: 'two winners, one at a time',
  actions: [
    { action: 'finalize', price: 100, targets: (c, p) => [c('main'), p('B')], },

    // 8162395 + (4117296 * .9975) = 12269397.7600
    // 4117296 * .0025 / 2 = 5146.62

    // 9275863 + (1724136 * .9975) = 10995688.6600  (fee rounding always in customer favour)
    // 1724136 * .0025 / 2 = 2155.17
    { action: 'assert', balances: { A: 8162395, B: 10995689, C: 8444446 }, graderBalances: { g1: 2155, g2: 0, g3: 2155 }, positions: { A: -4117296, B: 0, C: 2393160 } },

    // 8444446 + (2393160 * .9975) = 10831623.1000
    // 2155 + (2393160 * .0025 / 2) = 5146.45
    { action: 'claim-finalized', targets: (c, p) => [c('main'), p('A'), p('C')], },
    { action: 'assert', balances: { A: 8162395, B: 10995689, C: 10831624 }, graderBalances: { g1: 5146, g2: 0, g3: 5146 }, positions: { A: 0, B: 0, C: 0 } },

    // Again, just so we show nothing changes
    { action: 'claim-finalized', targets: (c, p) => [c('main'), p('B'), p('A'), p('C')], },
    { action: 'assert', balances: { A: 8162395, B: 10995689, C: 10831624 }, graderBalances: { g1: 5146, g2: 0, g3: 5146 }, positions: { A: 0, B: 0, C: 0 } },
  ],
})



.test({
  desc: 'two winners, all at once',
  actions: [
    { action: 'finalize', price: 100, targets: (c, p) => [c('main'), p('B'), p('C'), p('A')], },
    { action: 'assert', balances: { A: 8162395, B: 10995689, C: 10831624 }, graderBalances: { g1: 5146, g2: 0, g3: 5146 }, positions: { A: 0, B: 0, C: 0 } },
  ],
})



.test({
  desc: 'waive fees at 100',
  actions: [
    { action: 'finalize', price: 100, waiveFees: true, targets: (c, p) => [c('main'), p('B'), p('C'), p('A')], },
    { action: 'assert', balances: { A: 8162395, B: 10999999, C: 10837606 }, graderBalances: { g1: 0, g2: 0, g3: 0 }, positions: { A: 0, B: 0, C: 0 } },
  ],
})



.test({
  desc: 'waive fees at cancelPrice',
  actions: [
    { action: 'finalize', price: 50, waiveFees: true, targets: (c, p) => [c('main'), p('B'), p('C'), p('A')], },
    { action: 'assert', balances: { A: 10221043, B: 10137931, C: 9641026 }, graderBalances: { g1: 0, g2: 0, g3: 0 }, positions: { A: 0, B: 0, C: 0 } },
  ],
})


.run();
