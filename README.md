# Degens Smart Contract

This is the repository for the smart contract that underlies the Degens peer-to-peer betting exchange protocol.

The protocol is described in full detail in [our documentation](https://degensprotocol.github.io/degens-contract/protocol.html).

## Project Layout

* `contracts/`
  * `Degens.sol` - The solidity code for the Degens contract
  * `QueryDegens.sol` - A read-only contract that facilitates batch queries to the Degens contract
  * `TestToken.sol` - A simple ERC-20 token used in our test-suite
* `docs/`
  * `protocol.md` - The source code for our documentation ([rendered version](https://degensprotocol.github.io/degens-contract/protocol.html))
* `jslib/`
  * `DegensContractLib.js` - Javascript utilities for interacting with the contract. Used by the test framework
* `t/`
  * `lib/testlib.js` - Our custom test-suite framework
  * `*.js` - The test-cases that verify the smart contract's functionality

## Building

Install the `solc` [solidity compiler](https://github.com/ethereum/solidity/releases) somewhere in your path (`0.5.10` or later).

Checkout the submodules:

    git submodule update --init

Make sure you have a recent `node` installed (tested with version `8.10.0`).

Install the npm dependencies:

    npm i

Build the smart contract:

    make

## Running Tests

The entire test-suite can be run like this:

    make test

Or an individual test-case:

    node t/trade.js

## Coverage

In order to build a coverage report, first install the coverage dependencies:

    make install_coverage_deps

Then run the test-suite with coverage enabled:

    make coverage

Finally, render the coverage report:

    make render_coverage_report

The report will be in `coverage/index.html`

## Learn more

Please see [our protocol documentation](https://degensprotocol.github.io/degens-contract/protocol.html).
