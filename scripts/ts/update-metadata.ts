// Usage: ts-node create-token-metadata.ts
// This uses "@metaplex-foundation/mpl-token-metadata@2" to create tokens
// import "dotenv/config";
// import {
//   getExplorerLink,
// } from "@solana-developers/helpers";
import {
  Keypair,
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createUpdateMetadataAccountV2Instruction } from "@metaplex-foundation/mpl-token-metadata";

// const user = getKeypairFromEnvironment("SECRET_KEY");
export function loadWalletKey(keypairFile: string): Keypair {
  const fs = require("fs");
  const loaded = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString()))
  );
  return loaded;
}

const payer = loadWalletKey("bossS7QLVNAmJgnTts82mANU64PNSAvwmXma7ATBFmu.json");

const connection = new Connection(clusterApiUrl("devnet"));

console.log(
  `🔑 We've loaded our keypair securely, using an env file! Our public key is: ${payer.publicKey.toBase58()}`
);

const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// Subtitute in your token mint account
const tokenMintAccount = new PublicKey(
  "6kMYgotRgtZ2wfVE1ZyL3XM65ZXNDd2M78z4Y3jmep3Z"
);

const metadataPDAAndBump = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    tokenMintAccount.toBuffer(),
  ],
  TOKEN_METADATA_PROGRAM_ID
);

const metadataPDA = metadataPDAAndBump[0];

const transaction = new Transaction();
const accounts = {
  metadata: metadataPDA,
  tokenMintAccount,
  mintAuthority: payer.publicKey,
  payer: payer.publicKey,
  updateAuthority: payer.publicKey,
};
const dataV2 = {
  name: "Energy",
  symbol: "⚡",
  uri: "https://raw.githubusercontent.com/PredictiveSingularity/DAOE/refs/heads/master/metadata/metadata.json",
  // we don't need that
  sellerFeeBasisPoints: 0,
  creators: null,
  collection: null,
  uses: null,
};
const args = {
  updateMetadataAccountArgsV2: {
    data: dataV2,
    isMutable: true,
    updateAuthority: payer.publicKey,
    primarySaleHappened: true,
  },
};
const createMetadataAccountInstruction =
  createUpdateMetadataAccountV2Instruction(accounts, args);

transaction.add(createMetadataAccountInstruction);

const transactionSignature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [payer]
);

// const transactionLink = getExplorerLink(
//   "transaction",
//   transactionSignature,
//   "devnet"
// );

// console.log(`✅ Transaction confirmed, explorer link is: ${transactionLink}!`);

// const tokenMintLink = getExplorerLink(
//   "address",
//   tokenMintAccount.toString(),
//   "devnet"
// );

// console.log(`✅ Look at the token mint again: ${tokenMintLink}!`);

console.log(`✅ Metadata created!`);
