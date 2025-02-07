import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import fetch from "node-fetch";

export function loadWalletKey(keypairFile:string): Keypair {
    const fs = require("fs");
    const loaded = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString())),
    );
    return loaded;
  }

const payer = loadWalletKey("bossS7QLVNAmJgnTts82mANU64PNSAvwmXma7ATBFmu.json");

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
const METAPLEX_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"); // Programme Metaplex

async function getMintMetadata(mintAddress: PublicKey) {
    try {
        // 📌 Adresse du compte des métadonnées Metaplex
        const metadataPDA = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), METAPLEX_PROGRAM_ID.toBuffer(), mintAddress.toBuffer()],
            METAPLEX_PROGRAM_ID
        )[0];

        // 🔎 Récupérer les données on-chain
        const accountInfo = await connection.getAccountInfo(metadataPDA);
        if (!accountInfo) return null;

        // 🧩 Extraire l'URL du JSON
        const metadataUri = accountInfo.data.toString("utf8").match(/https?:\/\/[^\x00-\x1F\x7F]+/)?.[0];
        if (!metadataUri) return null;

        // 🌍 Récupérer le JSON des métadonnées
        const response = await fetch(metadataUri);
        const metadata = await response.json();

        return {
            mint: mintAddress.toBase58(),
            name: metadata.name,
            symbol: metadata.symbol,
            image: metadata.image || "Aucune image",
            metadataUri
        };
    } catch (error) {
        console.log(`⚠️ Erreur lors de la récupération des métadonnées pour ${mintAddress.toBase58()}`);
        return null;
    }
}

async function listMintsWithMetadata() {
    console.log("🔎 Recherche des mints associés à votre wallet...");

    // 📦 Récupérer les comptes SPL liés au wallet
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        payer.publicKey,
        { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") } // SPL Token Program
    );

    const mintAddresses = tokenAccounts.value.map(account => new PublicKey(account.account.data.parsed.info.mint));

    console.log(`✅ ${mintAddresses.length} mints trouvés. Récupération des métadonnées...`);

    // 🔄 Récupérer les métadonnées de chaque mint
    const metadataList = await Promise.all(mintAddresses.map(getMintMetadata));

    // 📋 Afficher les résultats
    metadataList.forEach(meta => {
        if (meta) {
            console.log(`🪙 Mint: ${meta.mint}`);
            console.log(`   📛 Nom: ${meta.name} (${meta.symbol})`);
            console.log(`   🖼️ Image: ${meta.image}`);
            console.log(`   🔗 Métadonnées: ${meta.metadataUri}\n`);
        }
    });

    return metadataList;
}

// 🚀 Exécuter
listMintsWithMetadata().catch(console.error);
