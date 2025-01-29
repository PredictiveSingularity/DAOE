const web3 = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID } = require('@solana/spl-token');

class Singularity {
    constructor(network) {
        this.mint = '4EBXjfpGBhQGE2Ue5w8mEmTys31cgDU2FFGZ5ipV96Td';
        this.contract = 'GhinKPLYtbc2Q8PEwLEJPKhvP5jPmcwUiKmBmGt53guK';
        this.account = 'EiReQ42J25b4EEj5PWvCXjZr6JX5YYUzptSi54TBnRw4';
        this.tk_program = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
        this.network = network;
    }

    async weight(address) {
        const connection = new web3.Connection(this.network, 'confirmed');
        const token = new Token(connection, new web3.PublicKey(this.mint), TOKEN_PROGRAM_ID, null);
        const accountInfo = await token.getOrCreateAssociatedAccountInfo(new web3.PublicKey(address));
        return accountInfo.amount;
    }
}

singularity = new Singularity('https://api.devnet.solana.com');
console.log(singularity.weight(singularity.account));