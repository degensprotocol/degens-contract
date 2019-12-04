import {ethers} from 'ethers';

const domainSchema = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "chainId", type: "uint256" },
    { name: "verifyingContract", type: "address" },
];

const permitSchema = [
    { name: "holder", type: "address" },
    { name: "spender", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "allowed", type: "bool" },
];



export const domains = {
    daiMainnet: {
        name: "Dai Stablecoin",
        version: "1",
        chainId: "1",
        verifyingContract: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    },
};




export async function signPermit(provider, domain, message) {
    let signer = provider.getSigner();
    let myAddr = await signer.getAddress();

    if (myAddr.toLowerCase() !== message.holder.toLowerCase()) {
        throw(`signPermit: address of signer does not match holder address in message`);
    }

    if (message.nonce === undefined) {
        let tokenAbi = [ 'function nonces(address holder) view returns (uint)', ];

        let tokenContract = new ethers.Contract(domain.verifyingContract, tokenAbi, provider);

        let nonce = await tokenContract.nonces(myAddr);

        message = { ...message, nonce: nonce.toString(), };
    }

    let typedData = {
        types: {
            EIP712Domain: domainSchema,
            Permit: permitSchema,
        },
        primaryType: "Permit",
        domain,
        message,
    };

    let sig = await provider.send(
                        'eth_signTypedData_v3',
                        [myAddr, JSON.stringify(typedData)]
                    );

    return { domain, message, sig, };
}
