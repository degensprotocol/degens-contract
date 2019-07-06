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
  ],
})


.test({
  desc: 'missing first',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {
        sigs[0] = [testlib.nullBytes32, testlib.nullBytes32];
      },
    },
    { action: 'assert', balances: { A: 12269398, B: 9275863, C: 8444446 }, graderBalances: { g1: 0, g2: 5146, g3: 5147 }, positions: { A: 0, B: 0, C: 0 } },
  ],
})



.test({
  desc: 'missing third',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {
        sigs[2] = [testlib.nullBytes32, testlib.nullBytes32];
      },
    },
    { action: 'assert', balances: { A: 12269398, B: 9275863, C: 8444446 }, graderBalances: { g1: 5146, g2: 5147, g3: 0, }, positions: { A: 0, B: 0, C: 0 } },
  ],
})



.test({
  desc: 'all 3',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {},
    },
    // 3431*3 = 10293 = 5146+5147
    { action: 'assert', balances: { A: 12269398, B: 9275863, C: 8444446 }, graderBalances: { g1: 3431, g2: 3431, g3: 3431, }, positions: { A: 0, B: 0, C: 0 } },
  ],
})



.test({
  desc: 'bad sigs: no sigs',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {
        sigs[0] = sigs[1] = sigs[2] = [testlib.nullBytes32, testlib.nullBytes32];
      },
      expectError: 'DERR_INSUFFICIENT_GRADERS',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})


.test({
  desc: 'bad sigs: only 1 sig',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {
        sigs[1] = sigs[2] = [testlib.nullBytes32, testlib.nullBytes32];
      },
      expectError: 'DERR_INSUFFICIENT_GRADERS',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})


.test({
  desc: 'bad sigs: only 1 sig, last position',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {
        sigs[0] = sigs[1] = [testlib.nullBytes32, testlib.nullBytes32];
      },
      expectError: 'DERR_INSUFFICIENT_GRADERS',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})


.test({
  desc: 'bad sigs: switched sig order',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {
        let temp = sigs[0];
        sigs[0] = sigs[1];
        sigs[1] = temp;
      },
      expectError: 'DERR_BAD_GRADER_SIG',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})


.test({
  desc: 'bad sigs: corrupted r value',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {
        sigs[1][0] = testlib.ethers.utils.bigNumberify(sigs[1][0]).add(1);
      },
      expectError: 'DERR_BAD_GRADER_SIG',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})


.test({
  desc: 'bad sigs: corrupted sv value',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {
        sigs[2][1] = testlib.ethers.utils.bigNumberify(sigs[2][1]).add(1);
      },
      expectError: 'DERR_BAD_GRADER_SIG',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})


.test({
  desc: 'corrupted witness',
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      modifyClaimComponents: (c) => {
        c.witness = testlib.ethers.utils.bigNumberify(c.witness).add(1);
      },
      expectError: 'DERR_BAD_GRADER_SIG',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})

.run();
