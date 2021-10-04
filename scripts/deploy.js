"use strict";

const ethers = require('ethers');
const child_process = require('child_process');


let jsonRpcUrl = process.argv[2];
if (!jsonRpcUrl) throw("must pass in jsonRpcUrl!");

let privKey = process.argv[3];
if (!privKey) throw("must pass in privKey!");


async function deploy() {
    let wallet = new ethers.Wallet(privKey);
    let provider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
    wallet = wallet.connect(provider);

    let nonce = await provider.getTransactionCount(wallet.address);
    if (nonce !== 0) throw(`nonce for address ${wallet.address} was ${nonce}, not 0`);

    child_process.execSync(`make`);

    let contracts = loadContracts();

    let factory = new ethers.ContractFactory(contracts.degensAbi, contracts.degensBin, wallet);
    let degensContract = await factory.deploy();
    console.log(`CONTRACT ADDRESS: ${degensContract.address}`);

/*
    let factory2 = new ethers.ContractFactory(contracts.testTokenAbi, contracts.testTokenBin, wallet);
    let testTokenContract = await factory2.deploy();
    console.log(`TEST TOKEN ADDRESS: ${testTokenContract.address}`);

    let factory3 = new ethers.ContractFactory(contracts.queryDegensAbi, contracts.queryDegensBin, wallet);
    let queryDegensContract = await factory3.deploy();
    console.log(`QUERY DEGENS ADDRESS: ${queryDegensContract.address}`);
*/
}

deploy();




/////////

function loadContracts() {
    let contracts = {};

    let degensSpec = require('../build/Degens.json');
    contracts.degensAbi = JSON.parse(degensSpec.contracts['contracts/Degens.sol:Degens'].abi);
    contracts.degensBin = degensSpec.contracts['contracts/Degens.sol:Degens'].bin;

    let testTokenSpec = require('../build/TestToken.json');
    contracts.testTokenAbi = JSON.parse(testTokenSpec.contracts['contracts/TestToken.sol:TestToken'].abi);
    contracts.testTokenBin = testTokenSpec.contracts['contracts/TestToken.sol:TestToken'].bin;

    let queryDegensSpec = require('../build/QueryDegens.json');
    contracts.queryDegensAbi = JSON.parse(queryDegensSpec.contracts['contracts/QueryDegens.sol:QueryDegens'].abi);
    contracts.queryDegensBin = queryDegensSpec.contracts['contracts/QueryDegens.sol:QueryDegens'].bin;

    return contracts;
}
