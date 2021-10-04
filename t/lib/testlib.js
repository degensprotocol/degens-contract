"use strict";

const ethers = require('ethers');
const ganacheCli = require('ganache-cli');
const child_process = require('child_process');
const waitforsocket = require('waitforsocket');

const DegensContractLib = require('../../jslib/DegensContractLib');


let degensAbi, degensBin, testTokenAbi, testTokenBin;

if (process.env.USE_SOL_COVERAGE || process.env.USE_SOL_PROFILER) {
    let degensSpec = require('../../artifacts/Degens.json');
    degensAbi = degensSpec.compilerOutput.abi;
    degensBin = degensSpec.compilerOutput.evm.bytecode.object;

    let testTokenSpec = require('../../artifacts/TestToken.json');
    testTokenAbi = testTokenSpec.compilerOutput.abi;
    testTokenBin = testTokenSpec.compilerOutput.evm.bytecode.object;
} else {
    let degensSpec = require('../../build/Degens.json');
    degensAbi = JSON.parse(degensSpec.contracts['contracts/Degens.sol:Degens'].abi);
    degensBin = degensSpec.contracts['contracts/Degens.sol:Degens'].bin;

    let testTokenSpec = require('../../build/TestToken.json');
    testTokenAbi = JSON.parse(testTokenSpec.contracts['contracts/TestToken.sol:TestToken'].abi);
    testTokenBin = testTokenSpec.contracts['contracts/TestToken.sol:TestToken'].bin;
}


const nullAddress = '0x0000000000000000000000000000000000000000';
const nullBytes32 = '0x0000000000000000000000000000000000000000000000000000000000000000';
const maxBytes32 = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
const ganacheMnemonic = 'anxiety permit surge method actual baby this helmet travel divert child latin';
const ganacheChainId = 1;



let gasUsed = {};



async function doTests(specs) {
    let specsDevMode = specs.filter(s => s.dev);
    if (specsDevMode.length) {
        specs = specsDevMode;
        console.log("RUNNING IN DEV MODE");
    }

    let origSpecsLen = specs.length;
    specs = specs.filter(s => !s.skip);
    if (origSpecsLen !== specs.length) console.log("SKIPPING ONE OR MORE TESTS");


    let counter = 1;

    for (let spec of specs) {
        try {
            let result = await doTest(spec, counter, specs.length);
        } catch(e) {
            console.error(`Exception thrown in test '${spec.desc}':`, e);
            process.exit(1);
        }

        counter++;
    }

    if (process.env.GAS) {
        console.log("GAS STATS");
        console.log(indent(summarizeGasUsed(gasUsed)));
    }

    if (process.env.USE_SOL_COVERAGE || process.env.USE_SOL_PROFILER) {
        process.exit(0); // some reference still hangs around
    }
}



let coverageReportCounter = 1;

let stopGanacheProcList = [];
process.on('exit', () => {
    for (let f of stopGanacheProcList) f();
});

async function doTest(spec, numTest, totalTests) {
    console.log(`  ${numTest}/${totalTests} ${spec.desc}`);


    let randVal = '0';

    let deterministicRandom = () => {
        randVal = ethers.utils.keccak256(Buffer.from(normalizeComponent(randVal, 256), 'hex'));
        return randVal;
    };


    let startTime = new Date(1544000000 * 1000); // for consistent gas usage


    let ethProvider;
    let providerEngine, coverageSubprovider, stopGanacheProc, ganacheProcPromise; // only used in coverage mode

    if (process.env.USE_SOL_COVERAGE || process.env.USE_SOL_PROFILER) {
        if (process.env.USE_SOL_COVERAGE && process.env.USE_SOL_PROFILER) throw("can't run with both coverage AND profiler");

        let ganacheProc = child_process.spawn('node_modules/.bin/ganache-cli', ['-m', ganacheMnemonic, '-p', '8501', '-t', startTime]);
        stopGanacheProc = () => {
            if (ganacheProc) {
                ganacheProc.kill('SIGQUIT');
                ganacheProc = undefined;
            }
        };

        stopGanacheProcList.push(stopGanacheProc);

        ganacheProcPromise = new Promise((resolve, reject) => {
            ganacheProc.on('close', () => {
                resolve(1);
            });
        });

        await waitforsocket('localhost', 8501, {timeout: 7500});


        const SolCompilerArtifactAdapter = require('@0x/sol-trace').SolCompilerArtifactAdapter;
        const ProviderEngine = require('web3-provider-engine');
        const RpcSubprovider = require('web3-provider-engine/subproviders/rpc.js');
        const CoverageSubprovider = require('@0x/sol-coverage').CoverageSubprovider;
        const ProfilerSubprovider = require('@0x/sol-profiler').ProfilerSubprovider;
 
        let artifactAdapter = new SolCompilerArtifactAdapter('artifacts/', 'contracts-temp-build/');
        let defaultFromAddress = "0x7034ac1de8c2eb00d3a52f22f9b2f90e578154c1"; // last address from ganache, using our mnemonic
        if (process.env.USE_SOL_COVERAGE) coverageSubprovider = new CoverageSubprovider(artifactAdapter, defaultFromAddress, true);
        else if (process.env.USE_SOL_PROFILER) coverageSubprovider = new ProfilerSubprovider(artifactAdapter, defaultFromAddress);
 
        providerEngine = new ProviderEngine();
        providerEngine.addProvider(coverageSubprovider);
        providerEngine.addProvider(new RpcSubprovider({rpcUrl: 'http://localhost:8501'}));
        providerEngine.start();
 
        ethProvider = new ethers.providers.Web3Provider(providerEngine);
    } else {
        let ganache = ganacheCli.provider({
            mnemonic: ganacheMnemonic,
            time: startTime,
            chainId: ganacheChainId,
            hardfork: process.env.HARDFORK || undefined,
            debug: process.env.DUMPOPCODES ? true : undefined,
            logger: process.env.DUMPOPCODES ? console : undefined,
        });

        ethProvider = new ethers.providers.Web3Provider(ganache);
    }


    let networkInfo = await ethProvider.getNetwork();


    let degensContract, testTokenContract;

    {
        let factory = new ethers.ContractFactory(degensAbi, degensBin, ethProvider.getSigner(0));
        degensContract = await factory.deploy({ gasLimit: 6000000, });
    }

    {
        let factory = new ethers.ContractFactory(testTokenAbi, testTokenBin, ethProvider.getSigner(0));
        testTokenContract = await factory.deploy(networkInfo.chainId, { gasLimit: 6000000, });
    }

    let extraTokens = {};

    let newExtraToken = async (name) => {
        let factory = new ethers.ContractFactory(testTokenAbi, testTokenBin, ethProvider.getSigner(0));
        extraTokens[name] = await factory.deploy(networkInfo.chainId, { gasLimit: 6000000, });
    };


    let accounts = await ethProvider.listAccounts();

    let accountSigner = {
        bank: ethProvider.getSigner(0),

        A: ethProvider.getSigner(1),
        B: ethProvider.getSigner(2),
        C: ethProvider.getSigner(3),
        D: ethProvider.getSigner(4),

        g1: ethProvider.getSigner(7),
        g2: ethProvider.getSigner(8),
        g3: ethProvider.getSigner(9),
    };

    let accountAddress = {
        bank: accounts[0],

        A: accounts[1],
        B: accounts[2],
        C: accounts[3],
        D: accounts[4],

        g1: accounts[7],
        g2: accounts[8],
        g3: accounts[9],
    };

    let playerNames = ['A', 'B', 'C', 'D'];
    let graderNames = ['g1', 'g2', 'g3'];

    let roundingLoss = 0;
    let totalDeposited = ethers.utils.bigNumberify(0);

    let orders = {};
    let executionPackedOrders = {};
    let match = {
       graderQuorum: "2",
       graderFee: "2500000",
       graders: [accountAddress.g1, accountAddress.g2, accountAddress.g3],

       recoveryTime: '' + Math.floor((startTime / 1000) + (86400 * 14)),
       cancelPrice: "500000000",

       details: {
           betType: "ps",
           spread: "-7.5",

           event: {
               sport: "nfl",
               team1: "Green Bay Packers",
               team2: "New England Patriots",
               kickoff: "1544125552",
               // for soccer: also league and region
           },
       },
    };


    if (spec.alterMatch) spec.alterMatch(match);


    let dumpInfo = async (tokenContract) => {
        if (!tokenContract) tokenContract = testTokenContract;

        let matchInfo = computeMatchInfo(match);

        let tokenConn = tokenContract.connect(accountSigner.bank);
        let degensConn = degensContract.connect(accountSigner.bank);

        let balances = {};
        let positions = {};
        let graderBalances = {};
        let contractBalance = await tokenConn.balanceOf(degensContract.address);

        for (let name of playerNames) {
            balances[name] = await tokenConn.balanceOf(accountAddress[name]);
            positions[name] = await degensConn.getPosition(matchInfo.matchId, accountAddress[name], tokenContract.address);
        }

        for (let name of graderNames) {
            graderBalances[name] = await tokenConn.balanceOf(accountAddress[name]);
        }

        return {
            contractBalance,
            balances,
            positions,
            graderBalances,
            roundingLoss,
        };
    };


    let invariantCheckingDisabled = false;

    let validateInvariants = (info) => {
        let contractBalance = info.contractBalance;
        let balances = info.balances;
        let graderBalances = info.graderBalances;
        let positions = info.positions;

        if (contractBalance.lt(0)) throw("contract balance negative");

        let balanceSum = Object.values(balances).reduce((sum,current) => sum.add(current), ethers.utils.bigNumberify(0));
        if (balanceSum.lt(0)) throw("balance sum negative");

        let positionSum = Object.values(positions).reduce((sum,current) => sum.add(current), ethers.utils.bigNumberify(0));
        if (!positionSum.isZero()) throw("position sum non-zero");

        let graderBalanceSum = Object.values(graderBalances).reduce((sum,current) => sum.add(current), ethers.utils.bigNumberify(0));
        if (graderBalanceSum.lt(0)) throw("graderBalance sum negative");

        let exposure = Object.values(positions).filter(e => e.gt(0)).reduce((sum,current) => sum.add(current), ethers.utils.bigNumberify(0));

        let lhs = exposure.add(info.roundingLoss);
        if (!lhs.eq(contractBalance)) {
            throw(`exposure + roundingLoss !== contractBalance (${lhs} != ${contractBalance})   [${exposure} + ${info.roundingLoss}]`);
        }

        if (!totalDeposited.eq(balanceSum.add(graderBalanceSum).add(contractBalance))) {
            throw(`totalDeposited !== balanceSum + graderBalanceSum + contractBalance (${totalDeposited} != ${balanceSum} + ${graderBalanceSum} ${contractBalance})`);
        }
    };


    let sendTx = async function(type, unissuedTx, action) {
        let tx, result, err;

        try {
            tx = await unissuedTx;
            result = await tx.wait();
        } catch(e) {
            err = true;
            if (action.expectError) {
                if (!e.message.match(action.expectError)) throw(`expected error "${action.expectError}" but instead got "${e.message}"`);
            } else {
                throw(e);
            }
        }

        if (action.expectError && !err) throw(`expected error "${action.expectError}" but no error was thrown`);

        if (process.env.VERBOSE_LOGS || action.dumpLogs) {
            let mapper = action.dumpLogs;
            if (!mapper) mapper = (e) => e;
            console.log(JSON.stringify(result.events.filter(e => e.event).map(e => e.args).map(mapper), null, 4));
        }

        if (action.expectLogs) {
            let expect = action.expectLogs;
            let events = result.events.filter(e => e.event);

            if (process.env.VERBOSE) {
                for (let e of events) console.log(`${e.event} ` + JSON.stringify(e.args, null, 4));
            }

            if (['trade', 'matchOrders', 'finalize', 'claim-finalized', 'recover-funds'].find(a => a === action.action)) {
                if (events.length < 1) throw(`no logs found for ${action.action} action`);
                let firstLog = events.shift();
                if ((action.action === 'trade' && firstLog.event !== 'LogRequestTrade') ||
                    (action.action === 'matchOrders' && firstLog.event !== 'LogRequestMatchOrders') ||
                    (action.action === 'finalize' && firstLog.event !== 'LogRequestClaim') ||
                    (action.action === 'claim-finalized' && firstLog.event !== 'LogRequestClaim') ||
                    (action.action === 'recover-funds' && firstLog.event !== 'LogRequestRecoverFunds')
                   ) {
                    throw(`unexpected requestType: ${action.action} / ${firstLog.event}`);
                }
            }

            if (events.length !== expect.length) {
                console.log("EVENTS: ", events);
                throw(`unexpected number of logs. saw ${events.length}, expected ${expect.length}`);
            }

            for (let i=0; i<events.length; i++) {
                if (Array.isArray(expect[i])) {
                    if (events[i].event !== expect[i][0]) throw(`unexpected log type: ${events[i].event}, expected ${expect[i][0]}`);

                    if (expect[i][0] === 'LogTradeError') {
                        let expectedStatus = expect[i][1];
                        let actualStatus = DegensContractLib.tradeStatusByNumber(events[i].args.status);
                        if (expectedStatus !== actualStatus) throw(`unexpected LogTradeError reason: ${actualStatus}, expected ${expectedStatus}`);
                    } else if (expect[i].length > 1) {
                        expect[i][1](events[i], accountAddress);
                    }
                } else {
                    for (let k of Object.keys(expect[i])) {
                        let eventVal = k === 'event' ? events[i][k] : events[i].args[k];
                        if (eventVal !== expect[i][k]) throw(`unexpected log value for log #${i}: ${k} was ${eventVal}, expected ${expect[i][k]}`);
                    }
                }
            }
        }

        if (result) {
            if (!gasUsed[type]) gasUsed[type] = [];
            gasUsed[type].push(result.gasUsed.toNumber());
        }

        //console.log(`DATA DUMP (${type})`, tx.data);
    };

    let sendAsync = (args) => {
        return new Promise((resolve, reject) => {
            ethProvider._sendAsync(args, (err,result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };


    //degensContract.on('LogDebug', (b) => console.log("DBG", b));


    let tokenAddrsCb = (name) => DegensContractLib.setMSB256(name === 'main' ? testTokenContract.address : extraTokens[name].address);
    let playerAddrsCb = (name) => accountAddress[name];


    let defaultOverrides = { gasLimit: 1000000, };

    for (let action of spec.actions) {
        if (!action) continue;

        if (process.env.VERBOSE) {
            console.log("ACTION");
            console.log(indent(action));
        }

        if (action.action === 'deposit') {
            let tokenContract = action.token ? extraTokens[action.token] : testTokenContract;

            await sendTx('deposit', tokenContract.connect(accountSigner.bank).transfer(accountAddress[action.from], action.amount), action);

            await sendTx('approve', tokenContract.connect(accountSigner[action.from]).approve(degensContract.address, action.approve !== undefined ? action.approve : maxBytes32), action);

            if (!action.token) totalDeposited = totalDeposited.add(action.amount);
        } else if (action.action === 'new-token') {
            newExtraToken(action.name);
        } else if (action.action === 'order') {
            let matchInfo = computeMatchInfo(match);

            let orderArgs = {
                maker: accountAddress[action.from],
                taker: action.taker ? accountAddress[action.taker] : nullAddress,
                token: action.token ? extraTokens[action.token].address : testTokenContract.address,
                matchId: matchInfo.matchId,
                amount: action.amount,
                price: decodePrice(action.price),
                direction: action.dir === 'invalid' ? 2 : action.dir === 'buy' ? 1 : 0,
                expiry: Math.floor(startTime / 1000) + (action.expiryOffset === undefined ? 86400 : action.expiryOffset),
                timestamp: Math.floor(startTime / 1000) + (action.timestampOffset === undefined ? -1 : action.timestampOffset),
                orderGroup: action.orderGroup || DegensContractLib.hexTruncate(deterministicRandom(), 12), // ethers.utils.randomBytes()
            };

            if (action.modOrderArgs) action.modOrderArgs(orderArgs);

            if (orders[action.orderId]) throw(`orderId already set: ${action.orderId}`);
            orders[action.orderId] = new DegensContractLib.Order(orderArgs);

            let chainId = ganacheChainId;
            if (action.chainId !== undefined) chainId = action.chainId;

            if (action.legacySig) {
                await orders[action.orderId].signWithProviderLegacy(accountSigner[action.from], degensContract.address, chainId);
            } else {
                await orders[action.orderId].signWithProviderGanache(ethProvider, degensContract.address, chainId);
            }

            executionPackedOrders[action.orderId] = orders[action.orderId].asExecutionPacked();

            if (action.modPackedOrder) action.modPackedOrder(executionPackedOrders[action.orderId]);
        } else if (action.action === 'testOrder') {
            let o = orders[action.orderId].asQueryPacked();

            let resp = await degensContract.connect(accountSigner[playerNames[0]]).testOrder(o);

            if (action.assertAmount && !resp[0].eq(action.assertAmount)) throw(`testOrder amount expected ${action.assertAmount} but got ${resp[0]}`);
            if (action.assertFilled && !resp[1].eq(action.assertFilled)) throw(`testOrder filled expected ${action.assertFilled} but got ${resp[1]}`);
        } else if (action.action === 'getPosition') {
            let matchInfo = computeMatchInfo(match);
            let resp = await degensContract.connect(accountSigner[playerNames[0]]).getPosition(matchInfo.matchId, accountAddress[action.of], testTokenContract.address);
            if (!resp.eq(action.assertAmount)) throw(`getPosition amount expected ${action.assertAmount} but got ${resp}`);
        } else if (action.action === 'getFinalizedStatus') {
            let matchInfo = computeMatchInfo(match);
            let resp = await degensContract.connect(accountSigner[playerNames[0]]).getFinalizedStatus(matchInfo.matchId);
            action.assert(resp);
        } else if (action.action === 'getFilledAmount') {
            let resp = await degensContract.connect(accountSigner[playerNames[0]]).getFilledAmount(orders[action.orderId].fillHash);
            if (!resp.eq(action.assertAmount)) throw(`getFilledAmount: expected ${action.assertAmount} but got ${resp}`);
        } else if (action.action === 'getCancelTimestamp') {
            let resp = await degensContract.connect(accountSigner[playerNames[0]]).getCancelTimestamp(accountAddress[action.of]);
            if (action.assertTimestamp && !resp.eq(action.assertTimestamp)) throw(`getCancelTimestamp: expected ${action.assertTimestamp} but got ${resp}`);
            if (action.assert && !action.assert(resp)) throw(`getCancelTimestamp: assert failed`);
        } else if (action.action === 'trade') {
            let matchId = nullAddress;
            let token = nullAddress;

            if (action.orderIds.length > 0) {
                matchId = orders[action.orderIds[0]].fields.matchId;
                token = orders[action.orderIds[0]].fields.token;
            }

            let expiry = action.expiryOffset ? (Math.floor(startTime / 1000) + action.expiryOffset) : 0;

            await sendTx(`trade_${action.orderIds.length}`, degensContract.connect(accountSigner[action.from]).trade(action.amount, expiry, matchId, token, action.orderIds.map(id => executionPackedOrders[id]), defaultOverrides), action);
        } else if (action.action === 'matchOrders') {
            let infoBefore = await dumpInfo();

            let matchId = orders[action.leftOrderId].fields.matchId;
            let token = orders[action.leftOrderId].fields.token;

            await sendTx(`matchOrders_${action.rightOrderIds.length}`, degensContract.connect(accountSigner[action.from]).matchOrders(matchId, token, executionPackedOrders[action.leftOrderId], action.rightOrderIds.map(id => executionPackedOrders[id]), defaultOverrides), action);

            let infoAfter = await dumpInfo();

            //console.log(makeInfoReadable(infoAfter));

            let positionDelta = infoAfter.positions[action.from].sub(infoBefore.positions[action.from]);
            if (positionDelta.abs().gt(DegensContractLib.MAX_PRICE)) throw('large position change after matchOrder: ' + positionDelta.toString());

            if (process.env.VERBOSE) console.log('Position change after matchOrder: ' + positionDelta.toString());
        } else if (action.action === 'cancel') {
            let token = action.token ? extraTokens[action.token].address : testTokenContract.address;

            await sendTx(`cancel`, degensContract.connect(accountSigner[action.from]).cancel(token, action.amount, action.orderGroup, defaultOverrides), action);
        } else if (action.action === 'cancelAll') {
            await sendTx(`cancelAll`, degensContract.connect(accountSigner[action.from]).cancelAll(defaultOverrides), action);
        } else if (action.action === 'finalize') {
            let matchInfo = computeMatchInfo(match);

            let price = decodePrice(action.price);
            if (action.waiveFees) price += 0x80000000;

            let sigs = [
                await signFinalizationMessage(accountSigner.g1, degensContract.address, matchInfo.matchId, price),
                await signFinalizationMessage(accountSigner.g2, degensContract.address, matchInfo.matchId, price),
                await signFinalizationMessage(accountSigner.g3, degensContract.address, matchInfo.matchId, price),
            ];

            let alterSigsCb = action.alterSigsCb;
            if (!alterSigsCb) alterSigsCb = (s) => s[1] = [nullBytes32, nullBytes32]; // by default g1 and g3 report
            alterSigsCb(sigs);

            let targets;

            if (action.targets) {
                targets = action.targets(tokenAddrsCb, playerAddrsCb);
            } else {
                targets = DegensContractLib.encodeClaimTargets([ { token: testTokenContract.address, addrs: playerNames.map(n => accountAddress[n]), } ]);
            }

            let c = computeClaimComponents(match);

            if (action.modifyClaimComponents) action.modifyClaimComponents(c);

            await sendTx(`claim_${targets.length}`, degensContract.connect(accountSigner[playerNames[0]]).claim(c.witness, c.graderQuorum, c.graderFee, c.graders, price, sigs, targets, defaultOverrides), action);

            if (action.roundingLoss) roundingLoss += action.roundingLoss;
        } else if (action.action === 'claim-finalized') {
            let matchInfo = computeMatchInfo(match);

            let targets = action.targets(tokenAddrsCb, playerAddrsCb);

            await sendTx(`claimFinalized_${targets.length}`, degensContract.connect(accountSigner[playerNames[0]]).claimFinalized(matchInfo.matchId, targets, defaultOverrides), action);

            if (action.roundingLoss) roundingLoss += action.roundingLoss;
        } else if (action.action === 'recover-funds') {
            let c = computeClaimComponents(match);

            await sendTx('recoverFunds', degensContract.connect(accountSigner[action.from]).recoverFunds(c.matchInfo.detailsHash, match.recoveryTime, match.cancelPrice, c.graderQuorum, c.graderFee, c.graders, defaultOverrides), action);
        } else if (action.action === 'fallback-send') {
            await sendTx('fallback', accountSigner[action.from].sendTransaction({ to: degensContract.address, value: action.value, }), action);
        } else if (action.action === 'update-match') {
            action.cb(match);
        } else if (action.action === 'token-set-transfer-fail') {
            await sendTx('setTransferFail', testTokenContract.connect(accountSigner.bank).setTransferFail(action.status), action);
        } else if (action.action === 'token-set-transfer-return-false') {
            await sendTx('setTransferReturnFalse', testTokenContract.connect(accountSigner.bank).setTransferReturnFalse(action.status), action);
        } else if (action.action === 'token-set-transfer-from-fail') {
            await sendTx('setTransferFromFail', testTokenContract.connect(accountSigner.bank).setTransferFromFail(action.status), action);
        } else if (action.action === 'token-set-transfer-from-return-false') {
            await sendTx('setTransferFromReturnFalse', testTokenContract.connect(accountSigner.bank).setTransferFromReturnFalse(action.status), action);
        } else if (action.action === 'token-magic-mint-tokens') {
            await sendTx('magicMintTokens', testTokenContract.connect(accountSigner.bank).magicMintTokens(accountAddress['bank'], action.amount), action);
        } else if (action.action === 'assert') {
            let info = await dumpInfo(action.token ? extraTokens[action.token] : undefined);

            if (action.balances) {
                for (let name of Object.keys(action.balances)) {
                    if (!info.balances[name].eq(action.balances[name])) {
                        throw(`balance of ${name} was ${info.balances[name]}, expected ${action.balances[name]}`);
                    }
                }
            }

            if (action.graderBalances) {
                for (let name of Object.keys(action.graderBalances)) {
                    if (!info.graderBalances[name].eq(action.graderBalances[name])) {
                        throw(`graderBalance of ${name} was ${info.graderBalances[name]}, expected ${action.graderBalances[name]}`);
                    }
                }
            }

            if (action.positions) {
                for (let name of Object.keys(action.positions)) {
                    if (!info.positions[name].eq(action.positions[name])) {
                        throw(`positions of ${name} was ${info.positions[name]}, expected ${action.positions[name]}`);
                    }
                }
            }

            if (action.filled) {
                let conn = await degensContract.connect(accountSigner.bank);

                for (let orderId of Object.keys(action.filled)) {
                    let filled = await conn.getFilledAmount(orders[orderId].fillHash);
                    if (!filled.eq(action.filled[orderId])) throw(`filled of order ${orderId} was ${filled}, expected ${action.filled[orderId]}`);
                }
            }
        } else if (action.action === 'disable-invariant-checking') {
            invariantCheckingDisabled = true;
        } else if (action.action === 'enable-invariant-checking') {
            invariantCheckingDisabled = false;
        } else if (action.action === 'increase-time') {
            let result = await sendAsync({ method: 'evm_increaseTime', params: [action.amount], });
        } else {
            throw(`unknown action: ${action.action}`);
        }

        let info = await dumpInfo();
        if (process.env.VERBOSE_DUMP) console.log(indent(makeInfoReadable(info)));
        if (!invariantCheckingDisabled) validateInvariants(info);
    }

    if (process.env.VERBOSE) {
        let info = await dumpInfo();
        console.log("FINAL STATE");
        console.log(indent(makeInfoReadable(info)));
    }

    if (process.env.USE_SOL_COVERAGE || process.env.USE_SOL_PROFILER) {
        const execSync = require('child_process').execSync;
 
        let matches = process.argv[1].match(/\/(\w+)\.js$/);
        if (!matches) throw("unable to get current filename");
        let filename = matches[1];
 
        if (process.env.USE_SOL_COVERAGE) await coverageSubprovider.writeCoverageAsync();
        else if (process.env.USE_SOL_PROFILER) await coverageSubprovider.writeProfilerOutputAsync();
 
        execSync(`mv -f coverage/coverage.json coverage/coverage-${filename}-${coverageReportCounter}.json`);
        coverageReportCounter++;

        coverageSubprovider.stop();
        providerEngine.stop();
        stopGanacheProc();

        await ganacheProcPromise;
    }

    return {};
}





class TestTemplateInstance {
    constructor(tmpl) {
        this.tmpl = tmpl;
        this.tests = [];
    }

    test(spec) {
        let actions = [];

        actions = actions.concat(spec.pre || []);
        actions = actions.concat(this.tmpl.pre || []);
        actions = actions.concat(spec.actions || []);
        actions = actions.concat(this.tmpl.post || []);
        actions = actions.concat(spec.post || []);

        let t = {
            desc: spec.desc,
            dev: spec.dev,
            actions,
        };

        this.tests.push(t);

        return this;
    }

    run() {
        doTests(this.tests);
    }
}

function testTemplate(tmpl) {
    return new TestTemplateInstance(tmpl);
}




function decodePrice(price) {
    if (typeof(price) === 'number') return Math.floor(price * 10000000);
    else if (typeof(price) === 'string') return parseInt(price);
    else throw(`unexpected value for price: ${price}`);
}




function summarizeGasUsed(gasUsed) {
    let output = {};

    for (let k of Object.keys(gasUsed).sort()) {
       let l = gasUsed[k];

       let summary = {
           avg: l.reduce((a,b) => a+b / l.length, 0),
           med: l.sort((a,b) => a-b)[Math.floor(l.length / 2)],
           min: Math.min.apply(Math, l),
           max: Math.max.apply(Math, l),
       };

       output[k] = summary;
    }

    return output;
}

function dumpGasTrack(name, l) {
    console.log(`${name} GAS USAGE:`);
    console.log(`  avg: ${l.reduce((a,b) => a+b / l.length, 0)}`);
    console.log(`  med: ${l.sort((a,b) => a-b)[Math.floor(l.length / 2)]}`);
    console.log(`  min: ${Math.min.apply(Math, l)}`);
    console.log(`  max: ${Math.max.apply(Math, l)}`);
}

function makeInfoReadable(info) {
    let output = {};

    for (let k of Object.keys(info)) {
        if (info[k] instanceof ethers.utils.BigNumber) output[k] = info[k].toString();
        else if (typeof info[k] === 'object') output[k] = makeInfoReadable(info[k]);
        else output[k] = info[k];
    }

    return output;
}



function computeMatchInfo(match) {
    let ordered = {};
    Object.keys(match).sort().forEach((key) => {
        ordered[key] = match[key];
    });

    let detailsHash = ethers.utils.keccak256(Buffer.from(JSON.stringify(ordered)));

    let witness = ethers.utils.keccak256(
                      Buffer.from(normalizeComponent(detailsHash, 256) +
                                  normalizeComponent(parseInt(match.recoveryTime), 256) +
                                  normalizeComponent(parseInt(match.cancelPrice), 256), 'hex'));

    let graderAddresses = '';
    match.graders.forEach(g => graderAddresses += normalizeComponent(g, 256));

    let content = Buffer.from(normalizeComponent(witness, 256) +
                              normalizeComponent(parseInt(match.graderQuorum), 256) +
                              normalizeComponent(parseInt(match.graderFee), 256) +
                              graderAddresses, 'hex');

    let matchId = ethers.utils.keccak256(content);

    return {
      detailsHash,
      witness,
      matchId,
    };
}


function computeClaimComponents(match) {
    let matchInfo = computeMatchInfo(match);

    return {
        witness: matchInfo.witness,
        graderQuorum: parseInt(match.graderQuorum),
        graderFee: parseInt(match.graderFee),
        graders: match.graders,

        matchInfo,
    };
}



async function signFinalizationMessage(wallet, contractAddr, matchId, finalPrice) {
    let details = {
        contractAddr: normalizeComponent(contractAddr, 160),
        matchId: normalizeComponent(matchId, 256),
        finalPrice: normalizeComponent(finalPrice, 32),
    };

    let msg = [
        details.contractAddr,
        details.matchId,
        details.finalPrice,
    ].join('');

    msg = ethers.utils.keccak256(Buffer.from(msg, 'hex'));

    let sig = await wallet.signMessage(ethers.utils.arrayify(msg));

    return DegensContractLib.packSignature(ethers.utils.splitSignature(sig));
}



function computeContractAddress(addr) {
    // Assumes nonce of address is 0
    let hash = ethers.utils.keccak256(ethers.utils.concat(['0xd694', ethers.utils.padZeros(addr, 20), "0x80"]));
    return ethers.utils.getAddress('0x' + hash.substr(26));
}



function normalizeComponent(inp, bits) {
    if (inp instanceof Buffer) inp = inp.toString('hex');
    else if (inp instanceof Uint8Array) inp = ethers.utils.hexlify(inp);
    else if (inp instanceof ethers.utils.BigNumber) inp = ethers.utils.hexlify(inp);
    else if (typeof(inp) === 'number') inp = ethers.utils.hexlify(inp);
    else if (typeof(inp) === 'string') {}
    else throw("unexpected type: " + typeof(inp));

    if (inp.substring(0, 2) === '0x') inp = inp.substring(2);
    inp = "0".repeat(Math.max(0, (bits/4) - inp.length)) + inp;

    if (inp.length > (bits/4)) throw("input too long");

    return inp;
}








function indent(obj) {
    let str = JSON.stringify(obj, null, 2);

    let indent = '  ';
    return indent + str.replace(/\n/g, '\n    ');
}



module.exports = {
    ethers,

    degensAbi,

    doTests,
    testTemplate,

    toWei: ethers.utils.parseEther,
    nullBytes32,
    maxBytes32,
    nullAddress,
};
