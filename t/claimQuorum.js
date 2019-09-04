let testlib = require('./lib/testlib.js');


testlib.testTemplate({
  pre: [
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
  desc: 'quorum 1, 1 provided',
  pre: [
    { action: 'update-match', cb: (m) => {
      m.graderQuorum = '1';
    }},
  ],
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {
        sigs[0] = sigs[1] = [testlib.nullBytes32, testlib.nullBytes32];
      },
    },
    { action: 'assert', balances: { A: 12269398, B: 9275863, C: 8444446 }, graderBalances: { g1: 0, g2: 0, g3: 5146+5147 }, positions: { A: 0, B: 0, C: 0 } },
  ],
})


.test({
  desc: 'quorum 1, 0 provided',
  pre: [
    { action: 'update-match', cb: (m) => {
      m.graderQuorum = '1';
    }},
  ],
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
  desc: 'quorum 3, 2 provided',
  pre: [
    { action: 'update-match', cb: (m) => {
      m.graderQuorum = '3';
    }},
  ],
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {
        sigs[1] = [testlib.nullBytes32, testlib.nullBytes32];
      },
      expectError: 'DERR_INSUFFICIENT_GRADERS',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})



.test({
  desc: 'quorum 3, 3 provided',
  pre: [
    { action: 'update-match', cb: (m) => {
      m.graderQuorum = '3';
    }},
  ],
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {},
    },
    { action: 'assert', balances: { A: 12269398, B: 9275863, C: 8444446 }, graderBalances: { g1: 3431, g2: 3431, g3: 3431 }, positions: { A: 0, B: 0, C: 0 } },
  ],
})


.test({
  desc: 'quorum 0 is invalid',
  pre: [
    { action: 'update-match', cb: (m) => {
      m.graderQuorum = '0';
    }},
  ],
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      expectError: 'DERR_ZERO_GRADER_QUORUM',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})


.test({
  desc: 'bad price was signed',
  actions: [
    { action: 'finalize', price: 101, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      expectError: 'DERR_BAD_FINALPRICE',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})

.test({
  desc: 'bad price was signed, fees waived',
  actions: [
    { action: 'finalize', price: '1000000001', waiveFees: true, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      expectError: 'DERR_BAD_FINALPRICE',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})

.test({
  desc: 'bad value for graderFee',
  pre: [
    { action: 'update-match', cb: (m) => {
      m.graderFee = '1000000001';
    }},
  ],
  actions: [
    { action: 'finalize', price: 100, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      expectError: 'DERR_INVALID_GRADERFEE',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})


.test({
  desc: 'too few graders passed',
  pre: [
    { action: 'update-match', cb: (m) => {
    }},
  ],
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {
        sigs.pop();
      },
      expectError: 'DERR_INVALID_NUM_SIGS',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})

.test({
  desc: 'too many graders passed',
  pre: [
    { action: 'update-match', cb: (m) => {
    }},
  ],
  actions: [
    { action: 'finalize', price: 0, targets: (c, p) => [c('main'), p('A'), p('B'), p('C'), ],
      alterSigsCb: (sigs) => {
        sigs.push(sigs[0]);
      },
      expectError: 'DERR_INVALID_NUM_SIGS',
    },
    { action: 'assert', balances: { A: 8162395, B: 9275863, C: 8444446 }, positions: { A: -4117296, B: 1724136, C: 2393160 } },
  ],
})



.run();
