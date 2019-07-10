const ethers = require('ethers');


const tradeStatusLookupByNumber = [
    'INVALID',
    'OK',

    'TAKER_NO_BALANCE',
    'TRADE_EXPIRED',
    'MATCH_FINALIZED',
    'TRADE_TOO_SMALL',

    'ORDER_NO_BALANCE',
    'ORDER_EXPIRED',
    'ORDER_FUTURE_TIMESTAMP',
    'ORDER_CANCELLED',

    'ORDER_BAD_SIG',
    'INCORRECT_TAKER',
    'AMOUNT_MALFORMED',
    'SELF_TRADE',
];

let tradeStatusLookupByName;

function tradeStatusByNumber(n) {
    let name = tradeStatusLookupByNumber[n];
    if (name === undefined) throw(`Unknown trade status number: ${n}`);
    return name;
}

function tradeStatusByName(n) {
    if (!tradeStatusLookupByName) {
        tradeStatusLookupByName = {};
        for (i=0; i<tradeStatusLookupByNumber.length; i++) {
            tradeStatusLookupByName[tradeStatusLookupByNumber[i]] = i;
        }
    }

    let number = tradeStatusLookupByName[n];
    if (number === undefined) throw(`Unknown trade status name: ${n}`);
    return number;
}



const domainSchema = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "verifyingContract", type: "address" },
];

const orderSchema = [
    { name: "maker", type: "address" },
    { name: "taker", type: "address" },
    { name: "token", type: "address" },
    { name: "matchId", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "price", type: "uint256" },
    { name: "direction", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "timestamp", type: "uint256" },
    { name: "orderGroup", type: "uint256" },
];

class Order {
    constructor(obj) {
        this.fields = {
            maker: hexNormalize(obj.maker, 20),
            taker: hexNormalize(obj.taker, 20),
            token: hexNormalize(obj.token, 20),
            matchId: hexNormalize(obj.matchId, 32),
            amount: hexNormalize(obj.amount, 32),
            price: hexNormalize(obj.price, 32),
            direction: hexNormalize(obj.direction, 32),
            expiry: hexNormalize(obj.expiry, 32),
            timestamp: hexNormalize(obj.timestamp, 32),
            orderGroup: hexNormalize(obj.orderGroup, 32),
        };

        this.fillHash = ethers.utils.keccak256(
            ethers.utils.concat([
                this.fields.maker,
                this.fields.token,
                this.fields.amount,
                this.fields.orderGroup,
            ])
        );
    }

    static fromTransportPacked(packed) {
        if (packed.startsWith("0x")) packed = packed.substr(2);
        packed = packed.toLowerCase();
        if (packed.length != 400) throw(`unexpected length for transport packed order: ${packed.length}`);

        let o = new Order({
            maker: '0x' + packed.substr(0, 20*2),
            taker: '0x' + packed.substr(20*2, 20*2),
            token: '0x' + packed.substr(40*2, 20*2),
            matchId: '0x' + packed.substr(60*2, 32*2),
            amount: '0x' + packed.substr(92*2, 16*2),
            price: '0x' + packed.substr(108*2, 4*2),
            direction: '0x' + packed.substr(112*2, 1*2),
            expiry: '0x' + packed.substr(113*2, 5*2),
            timestamp: '0x' + packed.substr(118*2, 5*2),
            orderGroup: '0x' + packed.substr(123*2, 12*2),
            flags: '0x' + packed.substr(135*2, 1*2),
        });

        o.addSignature(['0x' + packed.substr(136*2, 32*2), '0x' + packed.substr(168*2, 32*2)]);

        return o;
    }


    computeHash(contractAddress) {
        let domainHash = ethers.utils.keccak256(
            ethers.utils.concat([
                ethers.utils.keccak256(Buffer.from('EIP712Domain(string name,string version,address verifyingContract)')),
                ethers.utils.keccak256(Buffer.from('Degens')),
                ethers.utils.keccak256(Buffer.from('1.0')),
                hexNormalize(contractAddress, 32),
            ])
        );

        let orderHash = ethers.utils.keccak256(
            ethers.utils.concat([
                ethers.utils.keccak256(Buffer.from('Order(address maker,address taker,address token,uint256 matchId,uint256 amount,uint256 price,uint256 direction,uint256 expiry,uint256 timestamp,uint256 orderGroup)')),
                hexNormalize(this.fields.maker, 32),
                hexNormalize(this.fields.taker, 32),
                hexNormalize(this.fields.token, 32),
                this.fields.matchId,
                this.fields.amount,
                this.fields.price,
                this.fields.direction,
                this.fields.expiry,
                this.fields.timestamp,
                this.fields.orderGroup,
            ])
        );

        let hash = ethers.utils.keccak256(
            ethers.utils.concat([
                Buffer.from('1901', 'hex'),
                domainHash,
                orderHash,
            ])
        );

        return hash;
    }

    _buildTypedData(contractAddress) {
        return {
            types: {
                EIP712Domain: domainSchema,
                Order: orderSchema,
            },
            domain: {
                name: "Degens",
                version: "1.0",
                verifyingContract: hexNormalize(contractAddress, 20),
            },
            primaryType: "Order",
            message: this.fields,
        };
    }

    signWithProviderTypedData(provider, contractAddress) {
        return new Promise((resolve, reject) => {
            provider.sendAsync({
                method: "eth_signTypedData_v3",
                params: [this.fields.maker, JSON.stringify(this._buildTypedData(contractAddress))],
                from: this.fields.maker,
            }, (err,result) => {
                if (err) {
                    reject(err);
                } else { 
                    this.addSignature(packSignature(ethers.utils.splitSignature(result.result)));
                    resolve(true);
                }
            });
        });
    }

    async signWithProviderGanache(provider, contractAddress) {
        let sig = await provider.send("eth_signTypedData", [this.fields.maker, this._buildTypedData(contractAddress)]);
        this.addSignature(packSignature(ethers.utils.splitSignature(sig)));
    }

    async signWithProviderLegacy(wallet, contractAddress) {
        let hash = this.computeHash(contractAddress);
        let flatSig = await wallet.signMessage(ethers.utils.arrayify(hash));
        this.addSignature(packSignature(ethers.utils.splitSignature(flatSig)), true);
    }

    signWithPrivateKey(privateKey, contractAddress) {
        let signingKey = new ethers.utils.SigningKey(privateKey);
        if (hexNormalize(signingKey.address, 20) !== this.fields.maker) throw("private key's address does not match maker field");
        let hash = this.computeHash(contractAddress);
        let signature = signingKey.signDigest(hash);
        this.addSignature(packSignature(signature));
    }

    _packFirstTwoWords() {
        let flags = 0;

        if (this.fields.taker !== ethers.constants.AddressZero) flags |= 1;
        if (this.signatureIsLegacy) flags |= 2;

        return [
            ethers.utils.hexlify(ethers.utils.concat([
                this.fields.maker,
                ethers.utils.hexlify(flags),
                hexTruncate(this.fields.direction, 1),
                hexTruncate(this.fields.expiry, 5),
                hexTruncate(this.fields.timestamp, 5),
            ])),
            ethers.utils.hexlify(ethers.utils.concat([
                hexTruncate(this.fields.amount, 16),
                hexTruncate(this.fields.price, 4),
                hexTruncate(this.fields.orderGroup, 12),
            ])),
        ];
    }

    addSignature(sig, isLegacy) {
        if (this.signature) throw("signature already added to order");
        this.signature = sig;
        this.signatureIsLegacy = isLegacy;
    }

    getSignature() {
        return this.signature;
    }

    asExecutionPacked() {
        return this._packFirstTwoWords().concat(this.signature);
    }

    asQueryPacked() {
        return this._packFirstTwoWords().concat([
            this.fields.matchId,
            hexNormalize(this.fields.token, 32),
        ]);
    }

    asTransportPacked() {
        let flags = 0;

        if (this.signatureIsLegacy) flags |= 2;

        return ethers.utils.hexlify(ethers.utils.concat([
            this.fields.maker,
            this.fields.taker,
            this.fields.token,
            this.fields.matchId,
            hexTruncate(this.fields.amount, 16),
            hexTruncate(this.fields.price, 4),
            hexTruncate(this.fields.direction, 1),
            hexTruncate(this.fields.expiry, 5),
            hexTruncate(this.fields.timestamp, 5),
            hexTruncate(this.fields.orderGroup, 12),
            ethers.utils.hexlify(flags),
            this.signature[0],
            this.signature[1],
        ]));
    }
}



function hexNormalize(inp, numBytes) {
    inp = ethers.utils.hexZeroPad(ethers.utils.hexlify(inp), numBytes);
    if (inp.length !== (numBytes*2)+2) throw(`input ${inp} exceeds ${numBytes} bytes`);
    return inp.toLowerCase();
}

function hexTruncate(inp, numBytes) {
    if (!inp.startsWith('0x')) throw(`input didn't start with 0x: ${inp}`);
    inp = inp.substr(2);
    return '0x' + inp.substr(inp.length-(numBytes*2));
}

function packSignature(sig) {
    if (sig.s.length !== 66) throw('unexpected length for s');
    let msb = parseInt(sig.s.substr(2,2), 16);
    if ((msb & 128) !== 0) throw('most significant bit of s was set');
    if (sig.v !== 27 && sig.v !== 28) throw('unexpected value for v');

    if (sig.v === 28) msb |= 128;
    return [sig.r, hexNormalize(msb, 1) + sig.s.substr(4)];
}

module.exports = {
  tradeStatusByNumber,
  tradeStatusByName,
  Order,
  hexNormalize,
  hexTruncate,
};