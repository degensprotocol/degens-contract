let testlib = require('./lib/testlib.js');

let external = {
    trade: 1,
    matchOrders: 1,
    cancel: 1,
    cancelAll: 1,
    claim: 1,
    claimFinalized: 1,
    recoverFunds: 1,
};

let payable = {
};


for(let e of testlib.degensAbi) {
    if (e.type === 'function' && !e.constant && !e.stateMutability === 'view') {
        if (!external[e.name]) throw(`Unexpected non-constant entry in external interface: ${e.name}`);
    }

    if (e.payable) {
        if (e.type !== 'fallback' && !payable[e.name]) throw(`Unexpected payable entry in external interface: ${e.name}`);
    }
}

console.log("  1/1 no unexpected public or payable functions found");
