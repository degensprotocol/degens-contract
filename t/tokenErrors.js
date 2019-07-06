let testlib = require('./lib/testlib.js');


testlib.doTests([

{
  desc: "token transferFrom() fails",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },

    { action: 'token-set-transfer-from-fail', status: true, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectError: 'transferFrom failure', },

    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "token transferFrom() returns false",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },

    { action: 'token-set-transfer-from-return-false', status: true, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectError: 'DERR_TOKEN_TRANSFERFROM_FAIL', },

    { action: 'assert', balances: { A: 10000, B: 10000, }, positions: { A: 0, B: 0, } },
  ],
},

{
  desc: "token transfer() fails",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'trade', from: 'B', orderIds: [1], amount: 500, },

    { action: 'assert', balances: { A: 9667, B: 9501, }, positions: { A: 832, B: -832, } },

    { action: 'token-set-transfer-fail', status: true, },

    { action: 'finalize', price: 0, expectError: 'transfer failure', },
  ],
},

{
  desc: "token transfer() returns false",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'trade', from: 'B', orderIds: [1], amount: 500, },

    { action: 'assert', balances: { A: 9667, B: 9501, }, positions: { A: 832, B: -832, } },

    { action: 'token-set-transfer-return-false', status: true, },

    { action: 'finalize', price: 0, expectError: 'DERR_TOKEN_TRANSFER_FAIL', },
  ],
},

{
  desc: "token transfer() fails for just one account",
  actions: [
    { action: 'deposit', from: 'A', amount: 10000, },
    { action: 'deposit', from: 'B', amount: 10000, },
    { action: 'deposit', from: 'C', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },
    { action: 'trade', from: 'B', orderIds: [1], amount: 500, },
    { action: 'trade', from: 'C', orderIds: [1], amount: 500, },

    { action: 'assert', balances: { A: 9334, B: 9501, C: 9501, }, positions: { A: 1664, B: -832, C: -832, } },

    { action: 'finalize', price: 0, targets: (c, p) => [], },

    { action: 'token-set-transfer-fail', status: true, },
    { action: 'claim-finalized', targets: (c, p) => [c('main'), p('B')], expectError: 'transfer failure', },

    { action: 'disable-invariant-checking', },
    { action: 'token-set-transfer-fail', status: false, },
    { action: 'claim-finalized', targets: (c, p) => [c('main'), p('C')], },

    { action: 'assert', balances: { A: 9334, B: 9501, C: 10331, }, positions: { A: 1664, B: -832, C: 0, } },
  ],
},

{
  desc: "token very large balance",
  actions: [
    { action: 'token-magic-mint-tokens', from: 'A', amount: '0x100000000000000000000000000000000', },

    { action: 'deposit', from: 'A', amount: '0x100000000000000000000000000000000', },
    { action: 'deposit', from: 'B', amount: 10000, },

    { action: 'order', from: 'A', amount: 1000, dir: 'buy', price: 40, orderId: 1, },

    { action: 'trade', from: 'B', orderIds: [1], amount: 500, expectError: 'DERR_BALANCE_INSANE', },
  ],
},

]);
