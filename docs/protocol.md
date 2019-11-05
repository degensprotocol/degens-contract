# Introduction

Degens is a peer-to-peer betting exchange protocol. Rather than customer funds being held in escrow by a central company, it uses an Ethereum smart contract. This documentation describes how the protocol and smart contract is designed.

## Decentralized

In the Degens smart contract there are no owners, administrators, or any other privileged addresses. That means that every Ethereum address has the same privileges as any other. That even includes us, the developers. There are no owner modifiers, escape hatches, contract pausing, halting, or self-destructing. There are no affiliate fees, developer rewards, or rent-seeking tokens.

That is to say, the Degens smart contract is as decentralized as it is possible for an Ethereum smart contract to be. Participants specify their trust relationships in a hybrid on-chain/off-chain system.

## Sports Betting

Although the smart contract is not specific to sports betting, that is our initial area of focus. For our purposes, sporting events have the following advantages over other instruments:

* Sports betting is a large existing market that is not well-served by existing systems. Current systems suffer from unreliable, slow, and expensive payment processing, jurisdictional roadblocks, high trading fees, and significant counter-party risk (ie, bookies not paying out). We believe that a decentralized application provides an ideal solution to these problems.
* Most sporting events result in unambiguous and objective outcomes. These outcomes can by verified by watching the events on television, or by checking officially posted scores. Because of this, there is less of a need for resolving ambiguous or subjective outcomes, which is difficult to do fairly.

## Multi-Token Denominated

The Degens protocol supports betting with [almost](#token-assumptions) any [ERC-20](https://en.wikipedia.org/wiki/ERC-20) token. For example, WETH (wrapped ETH) or DAI (a stable token pegged to USD) are good choices since they are popular (many customers already have them) and are very liquid (easy and cheap to get if you don't have them).

Aside from the token chosen for betting, and a small amount of ETH needed for paying gas, no other tokens are necessary. Even ETH is not necessarily required, for example with the [matching provider strategy](#matching).

Many previous attempts at decentralized betting systems have created application-specific tokens that are needed for betting. We believe that requiring these "app-tokens" is undesirable. Not only must users learn how and where to acquire them, but to do so they need to pay trading fees and market spreads (which will be high prior to substantial demand).

Even obtaining and using WETH or DAI may be an obstacle for non-technical users. However, compared to other demographics, sports bettors are accustomed to having to jump through various hoops prior to being able to place bets. There is in fact an entire industry built around moving funds in unorthodox ways for the purpose of sports betting (NetTeller, Skrill).

## Custody of Funds

The primary advantage of using a smart contract for a betting exchange is to reduce counter-party risk for users. Assuming there are no bugs in the smart contract, not even developers or operators are able to access approved funds or funds locked into trades. Neither are they able to freeze accounts or unwind trades to prevent trading or withdrawals.

[Oracles](#oracles) are parties who are intended to be separate from the exchange. These parties do have the ability to mis-report outcomes of events. However, if an oracle does this they will leave undeniable evidence on the blockchain. We have designed the system to minimize the incentive for oracles to do this.

A corollary to the exchange not being able to freeze funds or interfere with trading is that nobody has the ability to reverse or unwind any activity on the platform. All trades are final. However, it is in the interests of exchanges and oracles building on top of the protocol to build reputable businesses. Any users who feel they have suffered losses due to errors on our part are encouraged to contact their providers.

If for whatever reason oracles don't finalize a match, funds can be recovered after waiting a certain period of time. See the [Funds Recovery](#funds-recovery) section below.

## Fixed-odds

All trades on Degens are **fixed-odds** bets. This means that the odds of a trade are known and agreed upon beforehand by the parties involved, and they cannot be changed after the fact. Of course, new subsequent trades can be made at different odds. Making new trades in the same direction as previous trades can serve to average up or down the position's cost basis, and trades in the opposite direction can either fully or partially close out the position at a profit or a loss, in which cases the account's balance will be immediately credited.

Fixed-odds betting is distinct from [parimutuel betting](https://en.wikipedia.org/wiki/Parimutuel_betting) where all the bets on an event are pooled together and therefore the odds are only known at the end of the betting session (which must be before the event starts, or very soon after).

## In-game Trading

Orders may be offered and trades may be created at any point up until match finalization. This allows users to enter into new positions or exit existing positions at any point prior to or during an event. Users who are unwilling to wait for finalization may even trade after the event has completed so as to have their balance available immediately (at a small cost).

We view this as an important aspect of the protocol. Being able to trade at half-time and TV intermissions, or even during live game play, adds a new level of excitement to the trading experience. However, due to the nature of distributed consensus as implemented by Ethereum, certain considerations need to be kept in mind. When two or more conflicting transactions are broadcast to the network, it is indeterminate which one will be mined first. For example, if an unexpected play occurs, a market maker who has an outstanding order may attempt to cancel the order at the same time one or more participants attempt to trade on it. Whether a trade is made, and by whom, is indeterminate.

Furthermore, not only is transaction ordering indeterminate, it can be influenced by gas price which adds a new dimension to in-game trading, one that may be attractive to sophisticated traders. Participants who don't wish to include gas prices in their trading models are advised to restrict in-game trading to half-time, timeouts, TV intermissions, etc, and to make careful use of the order expiry parameter.

Alternatively, by using a matching model, an exchange can eliminate the concerns above by introducing an amount of centralization to the order matching, as will be discussed in the section on [provider strategies](#provider-strategies).

## Partial Trades

Orders may offer any amount of a token to be traded, and orders may be completely or partially filled by trades created by one or more users. Once a trade is created, each of the two parties to the trade will have **positions** on the event, meaning that one of the parties will profit given one outcome, and the other will profit given the opposite. However, if either party wishes to exit their position, and there are willing participants in the market, the position may be fully or partially sold off, either at a different price (for a profit or a loss), or at the same price (for no profit or loss).

## Collateral

In order to enter trades, users need to have balances in the tokens they choose to use for betting. They also need to ensure they have granted the Degens smart contract approval to access these balances. The smart contract ensures that the balance will be only be accessed according to the user's wishes as expressed through signed orders they create.

Collateral requirements in Degens are more flexible than on many other platforms, and are designed with market makers in mind. Creating an order does not require reserving any funds from a user's balance. In fact, a user may create many orders all backed by the same account balance. Only once a trade is executed are funds reserved. If this reduces the balance enough that it affects the ability to fill the other outstanding orders, those orders are automatically reduced or cancelled to compensate.

Because users only need a balance to enter into trades, they can in fact create orders when they have 0 balance. The orders won't be visible to anyone until the user deposits or approves funds, claims winnings from a finalized match, or closes an existing position in a different match. At that point the orders will appear in the order-book. But note that some providers may not accept or relay unbacked orders.

Additionally, trades made in the opposite direction of an existing position can use the position itself as collateral. Because of this, given a position on an event and a zero balance, orders can still be created that, if filled, will partially or fully close out that position. And furthermore, the proceeds from closing that position can be used to create a new opposite position, even within the same trade.





# Events and Matches

## Events

An event is a future game, contest, or activity that people may be interested in betting on. It doesn't contain the terms of any bets, but simply acts as an identifier for this particular game. It is specified by a JSON object that contains such information as the type of sport, teams, scheduled kick-off time, and other information. For example:

    {
        "kickoff":"1559251530",
        "sport":"nfl",
        "team1":"Green Bay Packers",
        "team2":"New England Patriots"
    }

The exact structure of this JSON depends on the nature of the event, and is out of scope for the smart contract. Participants should come to a consensus on conventions for this structure.

Every event has a corresponding eventId, which is the keccak256 hash of this JSON after the JSON normalization process.

## JSON Normalization

The JSON normalization process is as follows:

1. Convert all leaf values to UTF-8 strings
    * Hashes and addresses are converted to lower-case hexadecimal strings with a `0x` prefix
    * Other numeric values are converted to decimal strings
1. Sort keys alphabetically
1. Minify (remove all unnecessary white-space)

After performing the above, the JSON is in a normalized format and is ready for hashing.

## Matches

A match consists of all the details for a particular proposition that participants can bet on. It is represented by a JSON object also. Here is an example:

    {
        "eventId": "0x01640ce2f97a4180d27d12e580c1264617f36d0ffec5e37faf18108fd0827ab0",

        "market": {
            "type": "spread",
            "spread": "-6.5",
            "rules": "0x541ea6ddbb4a619edd1f27de8ae661db1127dd7352d87f57526332654b699ebd"
        },

        "graderQuorum": "2",
        "graderFee": "2500000",
        "graders": [
            "0x51fc2b0de020257db35e3a425b73e13c1e0451ad",
            "0x9574f0146c45002e4742762adc74d78f78271349",
            "0x1b032aa9c8a867dfdbd09a3b419d5e52f9fb7fa0"
        ],

        "recoveryTime": "1567027530",
        "cancelPrice": "500000000"
    }

Each match references an event by its `eventId`. Multiple matches can reference the same event. For example, there may be several different [point spread](#point-spreads) matches for a single event.

The `market` key indicates the actual bet proposition related to the event. Similar to the structure of the eventId, its exact structure is outside the scope of the smart contract, although participants should arrive at a consensus on its conventions. For instance, in the above example, it specifies `team2` to win by at least 6.5 points. The `rules` element is a keccak256 hash of a JSON structure that describes (in free-form) the rules that will be used to grade the event.

The remainder of the keys are protocol-level fields, described in the [oracles section](#oracles).

### Computing matchIds

All of the information required to compute the matchId is present inside the match details JSON. It is done by computing a hash-tree that encodes various portions of the match details in a way that is accessible to the Degens smart contract:

<img src="merkleMatchId.svg" />

* To compute the matchId, start at the bottom level of the tree. This is simply the match details JSON object. It is normalized and hashed with keccak256 to compute the **detailsHash**.
* Moving to the next level of the tree, compute the keccak256 hash of the concatenation of **detailsHash** (from the previous step), **recoveryTime**, and **cancelPrice**. The last two values are encoded as big-endian `uint256` values. This hash is called the **witness**.
* Next, compute the keccak256 hash of the concatenation of the **witness** (from the previous step), **graderQuorum**, **graderFee**, and all the addresses in **graders** (in order). **graderQuorum** and **graderFee** are encoded as big-endian `uint256` values, and each grader address is left-padded with 0 bytes to make 32 bytes. The resulting hash is the **matchId**.

This somewhat cumbersome method of computing the matchId is so that the smallest amount of information needs to be passed to the contract for each operation:

* When creating orders, or executing them on the smart contract, only the **matchId** is required. Before doing so, all participants should download and examine the match details, market rules, and event JSON objects, and compute the matchId themselves using this information. Only if they are satisfied with the contents of the match should they create orders and/or execute other orders on the smart contract. Finally, they should ensure they save copies of these JSON objects.
* After an event has completed and its outcome is known, the specified graders will create signed messages indicating what they believe the final price should be. Once a quorum of graders has agreed on the final price, anybody can submit these signed messages along with the **witness**, **graderQuorum**, **graderFee**, and **graders** addresses. This will finalize the match at the price agreed upon by the graders. Note that *matchId* is not passed in when claiming because the smart contract computes this itself.
    * After the first participant has finalized the match, subsequent claims can be done with `claimFinalized` to reduce calldata costs.
* In case the graders do not create signed finalization messages for some reason, participants can wait until **recoveryTime**, at which point the contract can be finalized at **cancelPrice**. To do this, anybody can submit the **detailsHash**, **recoveryTime**, **cancelPrice**, **graderQuorum**, **graderFee**, and **graders** addresses. Note that the **witness** and **matchId** fields are not passed in, since the contract computes this itself.

Note: Because neither `eventId` not `matchId` embeds a contract address or a `chainId`, they can be used across multiple ethereum forks/testnets. This is not true for orders, however, which embed both to prevent replay attacks of user orders across chains (see the [EIP712 Domain details](#eip712-domain)).


### Point Spreads

Depending on the match type, it may have an associated **point spread**. This is a positive or negative number that is added to the final score of `team2` (the home team) prior to evaluating the outcome of a match. This is done so that even teams with different skill levels can be traded at close to even odds, and also so that ties ("pushes") cannot occur (because in most sports scores are integers but point spreads have fractional components).




# Prices and Odds

Understanding pricing and odds is critical to profitably trading on the Degens protocol (and elsewhere). Simultaneously buying and selling at different prices/odds is how market makers earn profit, and accurately assessing the probability of events and comparing those to posted prices (or creating their own prices) is how traders earn profit.

Using the Degens protocol, anyone can be a market maker, a trader, or both.

## Implied Probability

Each match may be valued at an integer **price** from 0 to 1e9 (1,000,000,000, or 1 american billion). This corresponds to the **odds** in traditional sports betting, since it reflects the perceived chances that an outcome will occur, and therefore the amount that a trader should risk to earn a given amount.

When a match is finalized, either the outcome will have been found to be true, in which case the contract will be finalized at a price of 1e9, or it will have been found to be false, in which case it will be finalized at a price of 0. Prior to finalization, market participants can choose to value a contract at prices in the range between 0 and 1 billion.

This range from 0 to 1e9 is chosen so it is easy to map to probability. To do so, scale the price by dividing it by 1e9.

Odds in this format are called **implied probability** odds and can easily be converted to [more conventional odds representations](#odds-conversion).

While 1e9 provides a very large granularity for prices, providers may require orders they post on their orderbooks to have less granular prices. For example, they may require that prices are integer multiples of 0.1.

## Bid-Ask Spread

The difference between the lowest ask and the highest bid is called the **bid-ask spread**. This spread is unrelated to the point spread discussed previously.

Because market makers attempt to buy at low prices and sell at high prices, they prefer large bid-ask spreads. Conversely, because they must pay market prices, traders who execute trades prefer small bid-ask spreads.

In a popular and competitively traded event, the bid-ask spread is typically smaller ("tighter") than in an unpopular event. This is because market makers tend to compete with each other by offering smaller bid-ask spreads, and also because traders will create orders at slighty better prices than the market makers, hoping to avoid paying the bid-ask spread by selling directly to another trader.

In a centralized exchange, it is usually impossible to have a negative bid-ask spread (where a bid is at a higher price than an ask) because these overlapping orders would be filled immediately. However, in the Degens protocol, negative bid-ask spreads are possible since order-books are decoupled from execution, and because there may be multiple independent order-books. Negative bid-ask spreads should be uncommon though because they represent opportunities for arbitrage. This is where an opportunistic trader simultaneously buys at the low ask price and sells at the high bid price so as to profit from the difference. The `matchOrders` function on the Degens contract allows atomic arbitrage, where either both of the trades will execute or neither will.

As well as negative bid-ask spreads, there can also be bid-ask spreads of zero. In this case there is no opportunity for arbitrage profits but the true bid-ask spread can be thought of as the gas required to execute a trade.

## Amount at Risk

When creating a trade, participants agree upon an integer price $Price_{trade}$ between 0 and 1e9 (non-inclusive). The amounts they must put at risk to form the trade depend upon this price, and are defined by this formula:

$$ A_{buyer} = A_{seller} \times \frac{Price_{trade}}{1e9 - Price_{trade}} $$

Or equivalently:

$$ A_{seller} = A_{buyer} \times \frac{1e9 - Price_{trade}}{Price_{trade}} $$

The total trade amount is simply the sum of the two amounts at risk:

$$ A_{total} = A_{buyer} + A_{seller} $$


## Finalization Prices

When a match has finished, graders will agree on a finalization price $Price_{final}$. This means the buyer can claim the following amount:

$$ A_{total} \times \frac{Price_{final}}{1e9} $$

And the seller can claim:

$$ A_{total} \times \frac{1e9 - Price_{final}}{1e9} $$

Finalization prices are usually either 1e9 or 0. This means that either the buyer or the seller respectively will be able to claim the entire amount, and the other will be able to claim nothing.

However, in certain rare circumstances a match will have no determinable outcome and will need to be finalized at the `cancelPrice` specified in the match details. The cancel price should be accounted for in trader models. Typically the cancel price will be `1e9 * .5`, however a different price may be provided if the initial market value of a contract is anticipated to be materially different. This is especially important for "money-line" matches (matches without point-spreads).





## Odds Conversion

As described in the [implied probability section](#implied-probability), prices can be converted to implied probability by simply dividing them by 1e9. Implied probability has several advantages over other odds representations. However, current sports bettors are familiar with a variety of formats so we will next present some abridged odds conversion tables:

#### Buy-side

|  Implied Probability  |  American  |  Decimal  |  Fractional  |
|:----:|:----:|:----:|:----:|
| .10 | +900 | 10 | 9-1 |
| .25 | +300 | 4 | 3-1 |
| .33 | +203 | 3.03 | ~2-1 |
| .40 | +150 | 2.5 | 3-2 |
| .50 | +/-100 | 2 | 1-1 |
| .60 | -150 | 1.67 | 2-3 |
| .66 | -194 | 1.52 | ~1-2 |
| .75 | -300 | 1.33 | 1-3 |
| .90 | -900 | 1.11 | 1-9 |

#### Sell-side

|  Implied Probability  |  American  |  Decimal  |  Fractional  |
|:----:|:----:|:----:|:----:|
| .10 | -900 | 1.11 | 1-9 |
| .25 | -300 | 1.33 | 1-3 |
| .33 | -203 | 1.52 | ~1-2
| .40 | -150 | 1.67 | 2-3
| .50 | +/-100 | 2 | 1-1
| .60 | +150 | 2.5 | 3-2
| .66 | +203 | 3.03 | ~2-1 |
| .75 | +300 | 4 | 3-1
| .90 | +900 | 10 | 9-1 |







# Off-chain Mechanics

The Degens protocol uses a hybrid on/off-chain approach. Match details, match finalization prices, and orders are communicated off-chain, but trade settlement occurs on-chain. We refer to this as the "EtherDelta model".


## Orders

An **order** is a signed message that indicates a willingness to bet on a match at a certain price.


### Signatures

Orders are hashed using the EIP712 scheme that gives wallets some information about the structure of the messages they are signing.

#### EIP712 Domain

The domain used by the Degens contract is given by the following specification:

    EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)

* The protocol name is `"Degens"`
* The version is `"1.0"`
* The chainId is `1` for the Ethereum mainnet
* The verifyingContract is the deployed contract address

#### EIP712 Order Schema

All fields of an order are hashed using the EIP712 algorithm. This hash is what is signed by the order creator.

The fields are given by the following schema:

    Order(
        address maker,
        address taker,
        address token,
        uint256 matchId,
        uint256 amount,
        uint256 price,
        uint256 direction,
        uint256 expiry,
        uint256 timestamp,
        uint256 orderGroup
    )

* **maker**: The Ethereum address that created and signed this order.
* **taker**: An Ethereum address representing the only address that is able to take this order (call `trade` or `matchOrders` with it). If this is the null address (20 `0` bytes), then anyone is allowed to take this order.
* **token**: The Ethereum address of the ERC-20 token that this order is denominated in.
* **matchId**: The derived identifier for the match being bet on (see [Computing matchIds](#computing-matchids)).
* **amount**: The maximum amount of `token` ERC-20 tokens that the order creator authorizes to be filled.
* **price**: A number between 1 and 999999999 inclusive, representing the price authorized by the order creator.
* **direction**: Either 0 for a sell order, or 1 for a buy order.
* **expiry**: Unix timestamp after which the order ceases to be valid.
* **timestamp**: Unix timestamp when this order was created. Used to support [bulk timestamp cancellation](#timestamp-cancellation).
* **orderGroup**: A value used to support grouping orders together for batch cancellations, and limiting the total amount at risk, even with separate orders. The simplest approach just generates a new random value for each order, in which case each order will belong to its own orderGroup.

#### Signature packing

Normally, an Ethereum signature is stored in two 32 byte variables `r` and `s`, and another 1 byte variable `v` (of which effectively only 1 bit is used). For calldata space efficiency, all signatures in the Degens protocol take the bit from `v` and pack it into the higher order bit of `s` (which is vanishingly unlikely to ever be non-zero).

So, in the Degens protocol, signatures are stored in two 32 byte variables `r` and `sv`. For more details see [here](https://github.com/HarryR/solcrypto/blob/master/contracts/ECDSA.sol) and [here](https://github.com/HarryR/solcrypto/blob/master/pysolcrypto/ecdsa.py).


### Order Packing

Orders have 3 different ways of being encoded (also known as "packed"). Each of these ways is used in a particular case.

#### Execution-packed

Execution-packed encoding is the encoding orders must be in when calling the `trade` or `matchOrders` function.

In this encoding, each order fits into 4 `uint256` values, so is 32 * 4 = 128 bytes long.

| uint256 word | Description | Size (bytes) |
|:-----|:------|:---|
| 0 | maker | 20 |
|   | flags | 1 |
|   | direction | 1 |
|   | expiry | 5 |
|   | timestamp | 5 |
| 1 | amount | 16 |
|   | price | 4 |
|   | orderGroup | 12 |
| 2 | r | 32 |
| 3 | sv | 32 |

* `matchId` and `token` must be submitted separately from the order. This is because when submitting multiple orders using `trade` or `matchOrders`, these values are required to be the same, so submitting them separately for each order would be redundant.
* `taker` is either `0x0` or the value of `msg.sender`, depending on bit 1 of `flags` (see [flags](#flags)).
* Words 2 and 3 represent the [packed](#signature-packing) signature.

#### Query-packed

Query-packed encoding is used when querying the contract as to the status of orders using the `testOrder` function. This function is a view, so it cannot modify chain state.

This encoding is identical to execution-packed except for the last 2 words, which change meaning. Since the order's signature does not depend on chain state and a client can check it manually, there is no need for `testOrder` to check it and therefore it is not required in this packing. However, matchId and token are not passed separately in `testOrder`, so they are included instead.

As with execution-packing, each query-packed order fits into 4 `uint256` values, so is 32 * 4 = 128 bytes long.

| uint256 word | Description | Size (bytes) |
|:-----|:------|:---|
| 2 | matchId | 32 |
| 3 | token address (left padded) | 32 |

#### Transport-packed

Transport-packed encoding is used when sending and receiving orders from an orderbook (off-chain). The fields are tightly packed and therefore overlap `uint256` boundaries (which is fine, since orders are never sent to the contract in this encoding).

Each transport-packed order is 200 bytes long.

| Field | Size (bytes) | Offset (bytes) |
|:-----|:---|:---|
| maker | 20 | 0 |
| taker | 20 | 20 |
| token | 20 | 40 |
| matchId | 32 | 60 |
| amount | 16 | 92 |
| price | 4 | 108 |
| direction | 1 | 112 |
| expiry | 5 | 113 |
| timestamp | 5 | 118 |
| orderGroup | 12 | 123 |
| flags | 1 | 135 |
| r | 32 | 136 |
| sv | 32 | 168 |

### Flags

The flags field is not strictly part of the order, but represents meta-information about the order which is required for verifying signatures.

It is 1 byte, and only the following bits are used (in order from least to most significant):

* **bit 1**: The taker field of this order is non-zero, meaning that only the specified address is allowed to call `trade` or `matchOrders` with this order. Because of this, if the bit is set, the `taker` field is assumed to be `msg.sender` for the purpose of signature verification. This bit is only needed for execution packed encoding. In query packed encoding it is ignored, and in transport packed encoding it is redundant since `taker` is included.

* **bit 2**: The signature has been computed using the legacy `"\x19Ethereum Signed Message:\n32"` prefix. This is to support old wallets that don't support EIP712. These signatures are computed identically to normal ones, except that after computing the order hash using the EIP712 scheme, the legacy prefix is prepended and then hashed, and this is what is signed. This is required in execution and transport packed, but ignored in query packed.

All other bits in the flags byte must be set to 0.


## Order Cancellation

Orders can be cancelled in three ways:

1. Order expiry (individual orders)
1. Timestamp cancellation (bulk orders)
1. Order group cancellation (custom set of orders)

#### Order expiry

Every order has an `expiry` field. This is a unix timestamp chosen by the order creator. The contract will reject any orders that have an expiry in the past.

Typically an order creator will set this to some point in time that they believe the odds will remain stable (or go in their favour). This is often kick-off, the end of half-time intermission, etc. However, some market maker bots may create orders with short-term expiration times (ie 15 minutes) to reduce the cost of cancelling and re-creating orders. This strategy is most useful when combined with order groups (see below).

#### Timestamp cancellation

Orders have a `timestamp` field. This is a unix timestamp that is supposed to represent when the order was created.

Participant addresses can have entries in the `cancelTimestamps` mapping in the contract. By calling the `cancelAll` function, each address can set its cancel timestamp to the current time. Any orders with `timestamp`s earlier than this value will be rejected by the contract.

This provides a way to "bulk" cancel all outstanding orders with a single transaction.

#### Order group cancellation

As described in the order schema section, every order has an `orderGroup` field. Because it is typically a random value, this functions similarly to a "nonce" or "salt" value in some protocols in that it provides the following attributes:

* Identical but separate orders (that is, orders on the same match with identical amount, price, etc), can be distinguished from one another.
* Order hashes cannot be predicted before the issuer generates them.

In addition to the above, order groups provide an extra optional feature: They can be used to batch cancel orders, or to create multiple orders sharing the same liquidity basis. This is because orders in the same order group have the same [fill hash](#fill-hash).

### Fill Hash

Many other protocols that support partial fills of orders, such as EtherDelta, 0x, and SportCrypt, use a hash of an order as an identifier and use this to track the portion of the order that has been filled. As a consequence, every new order gets an entirely separate fill amount that starts at 0 (unfilled) and goes up to the order amount (completely filled).

In the Degens protocol, the order hash and the fill hash are distinct. While the order hash is used for signing, the fill hash is used to track how much of the order has been filled. The fill hash is computed using a subset of the data from the order. Specifically, it is computed as follows (in solidity):

    fillHash = keccak256(abi.encodePacked(o.maker, o.token, o.amount, o.orderGroup))

So, multiple orders can be issued that all share the same fill hash, but differ in various properties such as matchId, direction, and price. However, these orders must share the same maker, token, amount, and orderGroup.

This permits the following use-cases:

* A market maker may wish to offer markets on a variety of sports, but limit the total amount of liquidity per-sport. This can be done by choosing an orderGroup when creating a batch of orders for each sport. In this case, the total possible exposure for each sport will be limited.
* When continually creating orders with short expiry times, it is desirable to create a new order before the older order expires, and replace the old order with the new one so that users are less likely to trade on expired orders. However, this could introduce a vulnerability in that there is a period of time where both orders are valid. If a user stores the old order and waits for the new order, he or she could trade on both of them, doubling the desired maximum exposure for the order creator. Using order groups, this can be solved by giving the new order the same order group as the old order. Sophisticated orderbook nodes can also automatically do the replacement of old about-to-expire orders by looking for duplicate fill hashes. Note that this technique can be relied on to replace an order with a better price (for the taker) but not a worse price, since the taker could simply use the original order to get the better price. To remove these orders, a maker must cancel or, if applicable, [soft cancel](#matching).



## Maintaining Orderbooks

Determining the amount of an order available to be executed depends on many on-chain values. Some of these are inside the contract of the token being used for betting, such as the balance and approval amounts, and some are inside the Degens contract, such as amounts filled, existing positions, cancellations, etc.

Because tracking all these values and re-implementing the contract logic is complicated and inconsistency of values may be a source of bugs, orderbook nodes may decide to use an ethereum node as the sole "source of truth" about an order's fillable status. This makes sense because it is guaranteed to have a consistent view of data at all times, handles blockchain re-orgs, and saves a lot of implementation effort. Instead of tracking all the data separately, a node just needs to watch the logs and determine which orders it needs to re-poll. In order to handle re-orgs, a node should also track what orders were modified by which blocks, so that it knows which orders need to be re-queried in these cases.

The Degens smart contract exposes a function called `testOrder`. This function accepts a single [query packed](#query-packed) order, and will return the following:

* The amount of the order that is currently available to be filled, account for balances, allowances, existing positions, cancellations, etc
* The amount that has currently been filled for this order's [orderGroup](#order-group-cancellation), or the maximum `uint256` value if this orderGroup has been explicitly cancelled.

Note that `testOrder` does not verify the signatures of orders since that is independent of chain state and can be done by the node when it first receives the order.

### Query Contract

Calling `testOrder` individually for every order that is affected by a block may take a long time due to node latency. To improve upon this, there is a separate contract called `QueryDegens` available that can query the status of a batch of orders all at once. Similarly, it supports querying balances and approvals for many addresses and many tokens in a single batch.

The reason that this batch functionality lives in a separate smart contract is so that its functionality can be improved upon later. Since it provides a pure read-only view, a new version of `QueryDegens` can be deployed with no effect on the main Degens contract.




## Provider Strategies

The Degens protocol, order model, and contract are designed to be flexible in how they are used. Generally, end-users will interact with one or more **providers**, either through their websites or by connecting their own nodes. How this works is independent of the protocol, and is only discussed in this document at an abstract level.

A provider is typically an exchange, sportsbook, or other liquidity aggregator. The provider strategy terminology is taken from the 0x protocol's [relayer strategies documentation](https://0x.org/wiki#Open-Orderbook), although we don't use the term relayer since providers may not actually relay any orders.

This section lists the high-level categories of provider strategies, although hybrid models are also possible.

While some of the strategies involve various levels of centralization, in no cases do users give up custody of their funds or positions.

### Open Orderbook

In this model, a provider accepts signed orders from its users, optionally categorizes, sorts, and curates them, and then transmits them to other interested users. These users can then, at their option, submit them to the Degens smart contract for execution.

Orders should have the `taker` field set to 0, since the maker intends to allow anyone to take the order.

#### Advantages

* This is in some senses the most decentralized strategy, in that trade settlement is done by the blockchain consensus protocol, and the provider doesn't have any control over it.
* Orders can be shared between different orderbooks, potentially even a purely peer-to-peer orderbook network.

#### Disadvantages

* There is a chance of trade collision, where multiple parties attempt to trade on the same order simultaneously. Since settlement is done on-chain, the party whose order is executed first is indeterminate, and depends on things like gas price, network congestion, etc.
* The provider has the ability to censor orders, although a provider who does this will likely be supplanted by one who doesn't since they will have strictly less liquidity (other orderbooks can copy all of its orders)
* The provider has access to new orders before any other participants, although being able to take advantage of this is difficult since the order will be available to anyone as soon as the provider tries to use it in a trade
* Users must pay gas to execute trades
* Cancelling orders prior to their expiration requires paying gas fees

#### Use-case

This model is for implementing a betting exchange used by crypto-native users, such as business-minded market makers. To use it effectively, users should understand Ethereum transactions, gas, and blockchain settlement.

### Matching

A provider can require the `taker` field on all orders they accept to be set to an address of their choosing. The contract will then ensure that the provider is the only party capable of executing these transactions. In this way, the provider can control the actual matching of orders by doing it off-chain, and then settle them in sequence on-chain.

#### Advantages

* Trade collisions will no longer occur, since the provider can maintain the fillability status of the orders off-chain and ensure they will never send try to fill an order that has already been filled.
* Users no longer need to pay gas fees, this is the responsibility of the provider.
* "Soft" cancels (where you trust the provider not to fill them) are instantaneous and free

#### Disadvantages

* Less decentralized than an open orderbook. Users must trust the provider to fill their orders in a timely fashion.
* Orders submitted to matching providers cannot be shared with other providers, since only the original provider can execute these orders

#### Use-case

This model allows the creation of a more conventional, user-friendly betting exchange, at the expense of a certain amount of centralization. There is no need for a maker/taker distinction, and users don't have to pay gas.


### Quote Provider

A provider can simply list prices and betting limits, without creating any orders. When users want to make bets, they submit signed orders to the provider with the taker field set to an address chosen by the provider. The provider will then fill these orders with `trade` and/or `matchOrders`, depending on if they want to assume the position and/or arbitrage it out against other orders.

#### Advantages

* Consistent betting limits on a large variety of events can be offered, without the user having to understand market depth or other attributes of a betting exchange
* Users don't need to worry about paying gas or making orders

#### Disadvantages

* Users don't have any guarantee that the provider will execute their orders. Although, if a provider consistently fails to execute orders in a timely fashion, users may choose to go elsewhere.

#### Use-case

This model is ideal for a retail-level sportsbook. By moving the execution and liquidity responsibility to the provider, users don't need to worry about betting exchange mechanics at all. By using the `matchOrder` function and external liquidity, these providers can operate at low or zero levels of risk.


### Reserve Manager

Reserve managers are providers who have confidence in their odds and are willing to accept positions, given favourable prices. To use this strategy, reserve managers create and sign either or both buy and sell orders on an event. They then publish these orders to open or matching orderbooks, or entirely separate systems, at their option. Note that there isn't really a hard distinction between a market maker and a reserve manager.

Orders can be set with short-term expiry values so the manager can update the prices and limits as needed (probably using [order groups](#order-group-cancellation)).

#### Advantages

* Sophisticated users who don't mind accepting positions can maximize the chances that other users will purchase positions from them.
* If the taker field is not set, orders can be shared between orderbooks.

#### Disadvantages

* Because many participants may wish to trade on these orders, there is a chance of trade collisions. However, typically these orders will be large, which reduces the chance of failed fills.

#### Use-case

This model is suited for institutional bookmakers who are comfortable with managing portfolios and assuming risk, and don't want to deal with running retail operations.



# On-Chain Mechanics

This section is an outline of the smart contract's core trading mechanics expressed in an idealized mathematical form. The actual implementation is structured slightly differently so as to avoid rounding loss, enable efficient invariant assertions, and to optimize gas usage. This description should not be taken as authoritative; the authoritative description is the smart contract source code.



## Trade Logic

### Positions

Positions are the result of trading, and they maintain the state of which accounts are eligible to collect the reserved funds once contracts have been finalized. Negative values for positions represent short positions, and positive values represent long positions. The positions represent the total amounts to be claimed, not the long or short amounts at risk.

### Effective Balances

To create a trade, users normally require sufficient token balance, $Bal_{account}$, to match their amount at risk. However, if a trade is made for a match the user already has a position on, and the trade is in the opposite direction of the existing position, then the position itself may be used as collateral. In this way, it is always possible to create new trades to close out existing positions.

Here is how the effective balance is computed for a buyer:

$$
Bal_{effective} = Bal_{account} +
  \begin{cases}
    -Position \times \frac{Price}{1e9}       & \quad \text{if } Position < 0 \\
    0                                        & \quad \text{if } Position >= 0
  \end{cases}
$$

And for a seller:

$$
Bal_{effective} = Bal_{account} +
  \begin{cases}
    Position \times \frac{1e9 - Price}{1e9}  & \quad \text{if } Position > 0 \\
    0                                        & \quad \text{if } Position <= 0
  \end{cases}
$$

$Bal_{effective}$ is computed for both parties to a trade. These values are then used to determine the amounts that will be used in the trade, along with the remaining order amount, the maximum trade amount, and the order price.


### Position Updates

When a trade is created, the positions for the participating accounts are updated by adding or substracting the total trade amount, $A_{total}$, as follows.

For the account performing the buy side of the trade:

$$ Position_{new} = Position_{old} + A_{total} $$

And for the account performing the sell side:

$$ Position_{new} = Position_{old} - A_{total} $$

Since there are opposite positions of equal magnitude created for every trade, prior to finalization all positions on a match net to 0:

$$ {\textstyle \sum_i} Position(account_{i}) = 0 $$

After finalization this invariant no longer holds because winners will claim their positions and in the process reset them to 0. Participants on the losing side have no reason to pay the gas to set their positions to 0. In other words, pre-finalization positions are always updated symmetrically, but post-finalization they are not. 



### Balance Updates

As well as updating the positions of the participating accounts, ERC-20 `transfer()` and `transferFrom()` calls are issued to modify the participant token balances according to the following formulae.

For the account performing the buy side of the trade:

\begin{align*}
Bal_{new} ={} & Bal_{old} \\
      & + \begin{cases}
              (-Position_{old} + min(0, Position_{new})) \times \frac{1e9 - Price}{1e9}  & \quad \text{if } Position_{old} < 0  \\
              0 & \quad \text{if } Position_{old} >= 0  \\
          \end{cases} \\
      & - \begin{cases}
              (Position_{new} - max(0, Position_{old})) \times \frac{Price}{1e9}  & \quad \text{if } Position_{new} > 0  \\
              0 & \quad \text{if } Position_{new} <= 0  \\
          \end{cases}
\end{align*}

And the sell side:

\begin{align*}
Bal_{new} ={} & Bal_{old} \\
      & + \begin{cases}
              (Position_{old} - max(0, Position_{new})) \times \frac{Price}{1e9}  & \quad \text{if } Position_{old} > 0 \\
              0 & \quad \text{if } Position_{old} <= 0  \\
          \end{cases} \\
      & - \begin{cases}
              (-Position_{new} + min(0, Position_{old})) \times \frac{1e9 - Price}{1e9}  & \quad \text{if } Position_{new} < 0 \\
              0 & \quad \text{if } Position_{new} >= 0  \\
          \end{cases} \\
\end{align*}

The intuition behind these equations is that an account's balance is debited for increasing the magnitude of a position and credited for reducing it. Since a position is being sold or purchased, the debit or credit amount depends on the price agreed upon for the trade.

If there are no preexisting positions, then both balances are decreased by the corresponding amounts necessary to cover the respective amounts at risk needed for the trade. However, if one or both of the parties have existing positions, and one or both of them are trading in an opposite direction to their positions, then the balances may increase. This is not always the case though since a single trade can close out an existing position (increasing balance) and additionally create an opposite position (decreasing balance).


### Order Amount Update

When a trade is made, the amount associated with the order's [fill hash](#fill-hash) is increased according to how much of the order's specified amount was consumed.

The difference between the filled amount and the order amount is what is used for later trades when determining how much of an order remains.



## Trading and matching functions

There are two functions in the smart contract for executing orders, `trade` and `matchOrders`.

### trade

The `trade` function is for "taking" one or more orders for the same matchId and trading token (but potentially different order creators and prices). The sender of this transaction is called the taker. This used by traders who interact directly with an orderbook and would like to attempt to achieve the best possible pricing, but don't mind creating Ethereum transactions, paying gas, and taking on an amount of execution risk (ie, the possibility that they will spend gas but won't actually create a trade).

    function trade(
        uint amount,
        uint expiry,
        uint matchId,
        address token,
        uint[4][] calldata packedOrders
      )

* `amount` : The maximum amount of the token being bet with that should be put at risk. This can be taken from the taker's token balance, or from a taker's existing opposite position on a match (their [effective balance](#effective-balances)).
* `expiry` : The unix timestamp at which this trade should be rejected. This is different from order expiry, and allows a taker to set an upper bound on how long this trade can be waiting to be mined before it will expire. If it is mined after this expiration date, the transaction will still succeed, but no trades will be created and a minimal amount of gas will be consumed. If this is 0, then the trade will not expire.
* `matchId` : The matchId of the match being traded on.
* `token` : The address of the token being used to bet with.
* `packedOrders` : A variable-length array of the orders to be traded against, in [execution-packed encoding](#execution-packed). These orders must all have the same values for `matchId` and `token` as is passed in to `trade`.

### matchOrders

The `matchOrders` function is primarily for performing atomic arbitrage. That is, two or more trades that are guaranteed to either both succeed or both fail. This is used when the prices of orders overlap (the bid is higher than the ask), allowing a risk-free profit to be earned.

While this can be used by participants to remove inefficiencies from an open orderbook, it can also be used to implement various other types of providers. See the [provider strategies](#provider-strategies) section for more details.

    function matchOrders(
        uint matchId,
        address token,
        uint[4] calldata packedLeftOrder,
        uint[4][] calldata packedRightOrders
      )

* `matchId` : The matchId of the match being traded on.
* `token` : The address of the token being used to bet with.
* `packedLeftOrder` : An [execution-packed](#execution-packed) order representing the "left" side of the trade. "Left" is merely a disambiguation term and doesn't represent anything meaningful, except that it comes first in the function and is therefore textually on the left. This can be a buy or a sell order, but its `matchId` and `token` must match what is passed in to `matchOrders`.
* `packedRightOrders` : An array of [execution-packed](#execution-packed) orders that should be matched against the `packedLeftOrder`. They all must have the opposite direction from `packedLeftOrder`, but share `matchId` and `token`. The orders must not have the same maker as the left order (because matchOrders assumes that the first matching trade will not change the effective balance used in the other matched trade).

Although similar to calling `trade` with two orders, `matchOrders` has certain advantages. For one, you don't need any capital to call `matchOrders` because the trades are made simultaneously. With `trade` you need enough capital to execute one of the trades initially, before selling it off with the second trade. Secondly, `matchOrders` will calculate the trade sizes required at execution time, whereas `trade` requires them to be specified up-front, which may be unreliable if the blockchain state changes in between creating your transaction and when your transaction is mined. But note this second advantage could also be solved by using a separate calculation smart contract.

Some notes regarding `matchOrders`:

* Although typically calling `matchOrders` will be profitable for the caller, this is not necessarily the case. If the [bid-ask spread](#bid-ask-spread) between left and right orders is non-negative, then the match will be subsidized by funds from `msg.sender`. While calling `matchOrders` with such orders does not make sense if your goal is arbitrage profits, it may be useful for a provider who mostly hedges positions at a profit, but who doesn't mind subsidizing a portion of a bet to improve user experience.
* When calling `matchOrders`, in theory the caller's position on a match should be unaffected. Because it buys a position with one order, and sells off that entire position to another order, only the balance is affected (usually it is increased, but see previous point). However, in some cases the caller will be left with a *residual position* on the match. This can happen because price granularity is limited to 1e-9, which means that the exact same position may not be purchasable by both trades. Typically this residual position is only a few wei, but at extreme prices may be as high as 1e9, which is still insignificant for typical tokens such as WETH and DAI. The worst effect of residual positions is actually the increased gas cost. If a position is set back to 0, then a modest gas refund is applied, but having a residual position prevents this refund.


## Event Logs

The contract emits events (solidity-style logs) in most situations.

For requests types that can execute multiple actions, a `LogRequestXYZ` log is issued before any other logs. This is used for tracking which of the following logs belong to each request:

| Event name | Description |
|:-----|:-------------------------------------------------|
| LogRequestTrade | `trade()` has been invoked on the contract |
| LogRequestMatchOrders | `matchOrders()` has been invoked on the contract |
| LogRequestClaim | `claim()` or `claimFinalized()` has been invoked on the contract |
| LogRequestRecoverFunds | `recoverFunds()` has been invoked on the contract |

Note that `cancel()` and `cancelAll()` do not emit `LogRequestXYZ` logs since they never execute multiple actions so emiting this event would waste gas.

After the `LogRequestXYZ` (if any) was emitted, subsequent action logs are emitted:

| Event name | Description |
|:-----|:-------------------------------------------------|
| LogTrade | A successful trade. ERC-20 transfers have been performed, positions and fill amounts updated. |
| LogTradeError | A trade failed. The `status` field will indicate the reason (see [Trade status](#trade-status) for how to decode it) |
| LogClaim | A claim has successfully been issued for a given `account` |
| LogCancel | An [order group](#order-group-cancellation) has been cancelled, cancelling one or more orders. Note that this logs all the fields required to compute the [fill hash](#fill-hash) |
| LogCancelAll | A bulk [timestamp cancellation](#timestamp-cancellation) was issued for an `account` |
| LogFinalizeMatch | A match was finalized, allowing users to [claim](#claim) their positions |

* In a successful `trade` or `matchOrders` function call it will emit either a `LogTrade` or a `LogTradeError` for each one of the `packedOrders` or `packedRightOrders`, up until `amount` or the `leftOrder` fillable amount is exhausted.
* In a successful `claim`, `LogFinalizeMatch` will be emitted if the match was not previously finalized. Every account address in the [claim targets](#claim-targets) that has a winning position will have an associated `LogClaim` emitted. `claimFinalized` is the same, except it never emits `LogFinalizeMatch`.
* Successful `cancel` and `cancelAll` function calls will emit `LogCancel` or `LogCancelAll` events respectively


## Trade Status

The `status` field of `LogTradeError` indicates why a trade failed. It will be one of the following enum values (except `INVALID` or `OK`). `LogTrade` does not include a `status` field since the status is always `OK`.

| Status | Description | Classification |
|:-----|:-------------------------------------------------|:----------|
| INVALID | An invalid trade status: This should only ever exist in a trade while it is being processed, so it should never appear in logs. This status is represented by `0`, so un-initialized `Trade` structs will have an invalid status.  | N/A |
| OK | The trade succeeded, funds have been transferred, and positions updated. This is the only status where changes to the contract's storage or ERC-20 transfers have been performed. | Success |
| TAKER_NO_BALANCE | The taker has insufficient effective balance | Fail: taker state |
| TRADE_EXPIRED | The taker set a trade expiration time, and the trade was mined after that | Fail: time |
| MATCH_FINALIZED | The match has been finalized, so no further trades are possible on this match | Fail: match state |
| TRADE_TOO_SMALL | The trade's amount would be too small, usually caused by dust balances and extreme order prices | Fail: taker or maker state |
| ORDER_NO_BALANCE | The maker has insufficient effective balance | Fail: maker state |
| ORDER_EXPIRED | The order's expiration timestamp has elapsed | Fail: time |
| ORDER_CANCELLED | The order was explicitly cancelled by the maker (either by cancelling its orderGroup, or bulk cancelling by timestamp) | Fail: maker state |
| AMOUNT_MALFORMED | The amount specified in the trade exceeds $2^{128} - 1$. Note that orders cannot specify amounts larger than this because they won't fit into the [execution packed](#execution-packed) encoding | Fail: malformed |
| SELF_TRADE | The taker and maker are the same address, which is disallowed | Fail: malformed |


## Contract Errors

The Degens contract can throw various errors during operation. These errors are distinct from the trade errors signified by [trade status](#trade-status), in that they abort the entire transaction. Usually these errors are a result of malformed input to the contract.

All errors created by the Degens contract are prefixed with `DERR_` to disambiguate them from errors from other contracts, in the case of a token contract throwing an error (which the Degens contract will not handle, and will abort the entire transaction), or when calling the Degens contract from another contract using an "internal transaction".

| Error | Description |
|:-----|:-------------------------------------------------|
| `DERR_UNKNOWN_METHOD` | Unknown function on the contract was called. This happens when you try to send a simple ether transfer to the contract, for example. |
| `DERR_INVALID_ORDER_SIGNATURE` | The signature provided with an order does not match the `maker` address' signature. |
| `DERR_INVALID_TAKER` | This order can only be invoked by a certain `taker`, and `msg.sender` is not this taker. NOTE: This error cannot actually be thrown, since [execution packed](#execution-packed) encoding does not explicitly include `taker`, and is assumed to be `msg.sender`. Otherwise, the trade will fail with `DERR_INVALID_ORDER_SIGNATURE` before the `taker` can be verified. |
| `DERR_INVALID_PRICE` | An order's price was not in the correct range (between 0 and 1e9, not inclusive) |
| `DERR_INVALID_DIRECTION` | An order's direction was not valid (must be either 0 or 1) |
| `DERR_EMPTY_PACKEDORDERS` | A malformed `trade` invocation: The `packedOrders` parameter was empty |
| `DERR_EMPTY_PACKEDRIGHTORDERS` | A malformed `matchOrders` invocation: The `packedRightOrders` array was empty |
| `DERR_SAME_MAKER` | A malformed `matchOrders` invocation: Cannot match two orders with the same `maker` |
| `DERR_SAME_DIRECTION` | A malformed `matchOrders` invocation: Cannot match two orders with the same direction (one must be a buy and the other a sell) |
| `DERR_LEFT_TRADE_FAIL` | During `matchOrders`, the left trade failed. Because the right trade is done first, if the left trade subsequently failed, the entire transaction must be aborted to undo the effects of the right trade. |
| `DERR_BAD_ORDERGROUP` | When calling `cancel`, an invalid orderGroup was provided (it must fit in 12 bytes) |
| `DERR_BAD_FINALPRICE` | In `claim`, the final price signed by the graders was not in the correct range (between 0 and 1e9, inclusive) |
| `DERR_ZERO_GRADER_QUORUM` | Malformed match: A grader quorum of 0 was specified, which is not allowed. |
| `DERR_INVALID_NUM_SIGS` | In `claim`, the number of signatures provided by the graders does not match the number of graders. |
| `DERR_INVALID_GRADERFEE` | In `claim`, the provided grader fee was not in the correct range (between 0 and 1e9, inclusive) |
| `DERR_BAD_GRADER_SIG` | In `claim`, one of the provieded signatures does not match the corresponding grader address' signature |
| `DERR_INSUFFICIENT_GRADERS` | In `claim`, not enough grader signatures were provided to meet the quorum |
| `DERR_MATCH_NOT_FINALIZED` | `claimFinalized` was invoked on a match that has not yet been finalized |
| `DERR_MATCH_IS_FINALIZED` | `recoverFunds` was invoked on a match that has already been finalized |
| `DERR_TOO_SOON_TO_RECOVER` | `recoverFunds` was invoked before the `recoveryTime` |
| `DERR_INVALID_CANCELPRICE` | In `recoverFunds`, the provided `cancelPrice` was not in the correct range (0 to 1e9, inclusive) |
| `DERR_TOKEN_TRANSFER_FAIL` | A `transfer()` call to a token failed by returning false |
| `DERR_TOKEN_TRANSFERFROM_FAIL` | A `transferFrom()` call to a token failed by returning false |
| `DERR_BALANCE_INSANE` | A user's token balance exceeded the max sane amount (must fit in 16 bytes) |


## Rounding Behaviour

The contract is designed to be wei-exact except in one case (described below).

After determining the amounts at risk for each party to a new trade, the contract verifies that the following invariants hold:

1. After adjusting positions, the sum of all the positions on a match must be 0.
1. The net of the change in balances must be the negative of the change in exposure for the match.

The exposure is the amount that will be claimable when the match finalizes. Due to invariant 1, this can be calculated as the sum of all positive positions on the match (or, equivalently, the sum of all negative positions on the match times -1).

If invariant 2 does not hold because it is off-by-one, then rounding has occurred when calculating the balance deltas. If the exposure is one more than it should be, then the position delta is reduced by 1. If the exposure is one less than it should be, the extra wei is arbitrarily added to the balance of the party creating the long-side of the trade. In any other case, an assertion is triggered.

After applying this rounding compensation, the invariants are rechecked, and an assert is triggered if they still aren't satisfied.

In our test-suite, these invariants are checked after every operation using a white-box view into the contract. As well as carefully chosen test values, we also have an amount fuzzer that exercises these invariant checks.

When a match is finalized at 0 or 1e9, then the winning positions will be transferred to the winners' balances, and the losing positions will (if ever claimed) be 0, so will not affect balances.

As mentioned above, there is one case where wei can be lost to the contract as dust. If a match is finalized at a finalization price other than 0 or 1e9, then any claimed amount will be rounded down to the nearest wei. This is necessary because positions can be divided up and sold to any number of participants.


## Contract Interactions

The Degens contract does not interact with any other contracts or libraries, except for the contracts of the tokens used for betting, for example WETH and DAI. It is up to the providers and users which token contracts they would like to support. Typically these contracts would be widely-used and well audited, as is the case with the WETH and DAI contracts.

The following are the interaction points where the Degens contract calls a token contract:

* In the `lookupBalance` function, the ERC-20 functions `balanceOf` and `allowance` are called. However, these are invoked with the [staticcall](https://eips.ethereum.org/EIPS/eip-214) op-code, so even a malicious contract cannot do anything harmful.
* In the `adjustBalance` function, the ERC-20 functions `transfer` and `transferFrom` are called, depending on whether the contract is crediting or debiting an account, respectively.

### Token assumptions

* The Degens contract will in certain cases give indivisible smallest units of tokens to an arbitrary party, or (rarely) allow them to be permanently lost as contract dust. Because of this, smallest token units should be of insignificant value. We recommend using tokens with 18 decimals, such as WETH or DAI.
* Tokens should have sufficient value and/or limited `totalSupply` such that no address has a balance exceeding $2^{128} - 1$ smallest units. With tokens such as DAI and WETH this provides ample dynamic range: up to ~340 quintillion DAI or WETH. 
* Tokens that don't explicitly return a result from `transfer` or `transferFrom` are [not ERC-20 compliant](https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca) and therefore may not work with Degens.

### Re-entrant Token Contracts

A malicious token contract can re-enter the Degens contract from within its `transfer` or `transferFrom` functions.

We have considered using a re-entrancy guard to protect against this but have decided it is not worth the added gas cost at this time. If [EIP-1283](http://eips.ethereum.org/EIPS/eip-1283) or similar is implemented, we will re-evaluate that decision for future versions of the contract.

We feel the risk from this attack is minimal, because:

* Token contracts are typically trusted by the users who are trading with them
* A malicious token contract could only attempt to steal its own tokens because token effects are isolated within a transaction (except for in `claim`/`claimFinalized`, where it is careful to reduce the position before performing the `transfer`)
* Most possible attacks, in particular the ones that would attempt to double-spend tokens to acquire two different positions, would fail while unwinding the call stack

Entirely implementing the Checks-Effects-Interactions pattern is not possible with the current architecture because `trade` and `matchOrders` both accept arrays of orders to process and these orders are processed (including issuing transfers) within a loop.



# Oracles

An oracle is an entity charged with providing information to the blockchain. Sometimes these entities are also called "graders" or "reporters". The Degens contract doesn't itself designate any addresses as oracles. Instead, when creating a match, oracle addresses are specified by the match creator. These addresses are accessible to the smart contract because they are encoded in the hash tree that results in the matchId. See [Computing matchIds](#computing-matchids) for details on how this works.

This matchId encoding permits a multi-sig arrangement for oracles. For example, a match could require at least 2 of 3 oracles to agree on a finalization price. Providers should ensure they only offer matches that designate oracles that they trust to offer reliable service for their users. Ideally, oracles should be independently operated to reduce the possibility of collusion.

Because the oracle's reporting record is permanently embedded onto the blockchain, users have indisputable evidence of any mis-reported matches. This is important because it may provide necessary evidence to recover an oracle's [bond](#oracle-bonding).

Additionally, there is no way for an oracle to report different outcomes to different users: A mis-reported finalization price will affect every participant of the match. This is important because as the number of participants on a match increases, it makes it less likely that an incorrect report would go unnoticed.


## Claim

After a match has been finalized, funds can be claimed by participants. There are two methods to do this, `claim` and `claimFinalized`. Participants calling `claim` must provide a quorum of valid grader signatures in order to finalize the match, and an array of [claim targets](#claim-targets) (which can be empty). If another transaction has already passed in the grader signatures, users claiming funds can save on calldata costs by calling `claimFinalized` instead of `claim`.

### Grader Signatures

A grader signature is a signature of the concatenation of the address of the Degens contract, the matchId being graded, and the final price. These signatures can only be created by the addresses specified in the match JSON, and this is validated by `claim` using the process described in [computing matchIds](#computing-matchids).

In the `claim` method, an array of [packed signatures](#signature-packing) must be passed in. This array of signatures must be the same length as the number of graders specified in the match JSON. Because not all oracles need to report, if a signature is missing for a particular grader it should be passed in as all zero bytes, in which case the signature will be skipped. After verifying all signatures (except ones that are all-zeros), the contract will ensure that at least `graderQuorum` signatures have been verified.

Note: Unlike order signatures, grader signatures are not specific to particular chain IDs. This is so that in the event of a network fork, users can claim their winnings from existing positions on the new fork. However, grader signatures do embed the contract address, so can only be used across chains with the same Degens contract address.


### Claim Targets

Both `claim` and `claimFinalized` require an array of `uint256` **claim targets**. This is a list of addresses, left-padded with 0 bytes. Since the contract supports betting with different tokens, the addresses for tokens being claimed need to be provided in addition to the addresses of participants making the claims.

The claim targets array is processed from start to finish. If a `uint256` with the most significant bit is set, it is considered a token address, and all the following addresses are considered patricipant addresses, up until the next `uint256` with a most-significant bit set.

This allows a user to claim winnings on a match denominated in several tokens in one call. Similarly, a betting provider could issue claims on behalf of its users, with multiple addresses having their winnings claimed in a single transaction.

<img src="claimTargets.svg" />

For example, in the above figure we are issuing 3 separate claims:

* player1 denominated in DAI
* player2 denominated in DAI
* player1 denominated in WETH




## Oracle Bonding

Providers may require oracles to put up a bond prior to permitting their matches to be offered on their platforms. In the event of an oracle reporting the outcome of a match incorrectly, affected users will have the option of appealing to a third-party arbiter for compensation. If the claim is deemed valid, and participants and the oracle can't come to a settlement, then the bond may be paid out to the claimant as compensation.

Because this is not directly part of the Degens protocol, its details aren't further discussed in this documentation. One option for third party arbitration is the [Kleros Blockchain Dispute Resolution Layer](https://kleros.io/).

## Oracle Fees

Because oracles incur a reputational risk (and financial risk, if bonded) every time they sign a finalization message, oracles deserve to be compensated. The Degens protocol allows oracles to earn a percentage of the total claimed amount. This percentage is specified in the match details, and providers should ensure that this fee is reasonable for their users prior to permitting it to be propagated on their platforms.

The fee is applied against the total amount to be claimed. This has the disadvantage that the fee, as expressed as a percentage of winnings, will change depending on the prices of the trade. However, it has the advantage that any number of trades can be made on a match without paying fees. For instance, a market maker who entirely nets out a position on a match will not end up paying any fees.

Charging the fees as a percentage of claimable amount at finalization time compensates the oracle fairly because they are assuming risk proprtional to the outstanding positions at finalization time. If users trade away their positions prior to finalization, this reduces the amount of risk the oracle assumes, so the fee should be less.

If the `finalPrice` signed by the oracles has the highest order bit set (treated as a `uint32`) then fees will be waived. This is useful when a match is cancelled, since users generally don't expect to pay fees in these circumstances.

## Oracle Competition

Since oracles are specified as an M-of-N multi-sig by the match creator, not all oracles need to report a result for a match in order for it to be finalized. The oracles that report will evenly split the fee. For example, 2 of 3 oracles may be required, in which case a match may be finalized with only 2, and each will take 50% of the grading fee. Although when calling `claim`, a participant *could* pass in all 3, this provides no benefit to the user, and increases gas costs. Because of this, oracles have an incentive to quickly create signed grading messages.

As described in the previous section, two users with opposing positions can trade with eachother prior to match finalization to avoid paying oracle fees. This ability for participants to cooperate and avoid fees helps ensure oracle fees are competitively low, and ultimately reduces the influence of oracles over the protocol.

## Funds Recovery

In the event that a sufficient number of oracles don't provide a result, after waiting a period of time the match can be finalized by anyone at the `cancelPrice` so that positions can be recovered.

As described in [computing matchIds](#computing-matchids), the Degens smart contract can access the `recoveryTime` and `cancelPrice` parameters by reconstructing the matchId's hash tree. Given these parameters the `recoverFunds` method can be invoked. If the current time has passed `recoveryTime`, then the contract will be finalized at `cancelPrice`, often `1e9 * 0.5`.

For this reason, every participant on a match should verify that the `recoveryTime` and `cancelPrice` are fairly set. The `recoveryTime` should be in the future, so nobody can prematurely invoke `recoveryTime`, but not too far in the future that funds will be locked for a long time. Similarly, every trader should keep a copy of the match details JSON, because this contains the information required to invoke `recoverFunds`.





# Conclusion

We believe all the pieces are in place for a decentralized prediction market for sporting events:

* Companies like BetFair have proven the viability of betting platforms modeled on financial exchanges
* Bitcoin has spread the notion of a blockchain as a trustless, world-wide, unstoppable currency
* Ethereum has implemented a blockchain implementation that allows the distribution of funds according to custom rules

The Degens smart contract is a truely decentralized system that allows providers to build systems with varying degrees of centralization.

The multi-sig oracle fee system carefully balances the conflicting goals of trustlessness and quick and inexpensive settlement.

Our hybrid on-chain/off-chain design allows us to build efficient and user-friendly services, while still maintaining the benefits of secure blockchain settlement.



# Document History

* v0.1 (Jul 1, 2019)
    * Initial release

## SportCrypt Whitepaper

Since the Degens protocol has its roots in the SportCrypt project, much of this documentation was adapted from its whitepaper.

* v0.4 (Sep 7, 2018)
    * Added this history section
* v0.3 (Dec 5, 2017)
    * Copy edits
* v0.2 (Nov 9, 2017)
    * Add section on bid-ask spreads
    * Minor equation fixes
* v0.1 (Oct 30, 2017)
    * First version of SportCrypt whitepaper
