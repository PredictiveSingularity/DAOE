import { 
  Connection, Keypair, PublicKey, clusterApiUrl, Transaction, sendAndConfirmTransaction , SendTransactionError
} from "@solana/web3.js";
import { 
  getAssociatedTokenAddress, createCloseAccountInstruction, burnChecked, TOKEN_PROGRAM_ID 
} from "@solana/spl-token";
import * as readline from "readline";

export function loadWalletKey(keypairFile:string): Keypair {
  const fs = require("fs");
  const loaded = Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypairFile).toString())),
  );
  return loaded;
}
import { createUpdateMetadataAccountV2Instruction } from "@metaplex-foundation/mpl-token-metadata";

const payer = loadWalletKey("bossS7QLVNAmJgnTts82mANU64PNSAvwmXma7ATBFmu.json");
const METAPLEX_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"); // Programme Metaplex


// Configuration de la connexion et du wallet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
//const KEEP_MINT = new PublicKey("6kMYgotRgtZ2wfVE1ZyL3XM65ZXNDd2M78z4Y3jmep3Z"); // Mint à conserver

// Récupère la liste des mints (d'après les comptes token associés au wallet)
async function getTokenAccounts() {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    payer.publicKey,
    { programId: TOKEN_PROGRAM_ID }
  );
  // Pour chaque compte, on récupère le mint et le solde (en nombre)
  return tokenAccounts.value.map(account => ({
    mint: new PublicKey(account.account.data.parsed.info.mint),
    amount: Number(account.account.data.parsed.info.tokenAmount.uiAmount)
  }));
}

// Fonction demandant une confirmation à l'utilisateur
function askUserConfirmation(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question("\n🛑 ATTENTION : Cette opération est IRRÉVERSIBLE !\n" +
      "Vous allez brûler la supply et fermer les comptes token associés à TOUS les mints EXCEPTÉ celui-ci :\n" +
      // `   ${KEEP_MINT.toBase58()}\n` +
      "Tapez 'OUI' pour confirmer : ", (answer) => {
      rl.close();
      resolve(answer.trim().toUpperCase());
    });
  });
}


async function burnAndCloseMints() {
  console.log("\n🔎 Récupération des mints liés au wallet...");
  const tokenAccounts = await getTokenAccounts();
  // Filtrer les mints à supprimer (tous sauf KEEP_MINT)
  const mintsToDelete = tokenAccounts; //.filter(account => !account.mint.equals(KEEP_MINT));
  
  console.log(`🚀 ${mintsToDelete.length} mints vont être traités.`);

  const confirmation = await askUserConfirmation();
  if (confirmation !== "OUI") {
    console.log("❌ Opération annulée. Aucune suppression effectuée.");
    return;
  }

  for (const { mint, amount } of mintsToDelete) {
    try {
      // Récupérer le compte associé (ATA) pour ce mint
      const ata = await getAssociatedTokenAddress(mint, payer.publicKey);
      // const tx = new Transaction();

      // Étape 1 : Brûler les jetons si la supply est > 0.
      if (amount > 0) {
        console.log(`🔥 Brûlez ${amount} ⚡ pour le mint ${mint.toBase58()} du compte ${ata.toBase58()}`);
        // burnChecked renvoie directement une TransactionInstruction.
        // burnChecked(
        //   connection,
        //   payer,
        //   ata,
        //   mint,
        //   payer.publicKey,
        //   amount,
        //   6 // Decimals
        // );
      } else {
        console.log(`Aucun jeton à brûler pour le mint ${mint.toBase58()}.`);
      }

      // Étape 2 : Fermer le compte associé (ATA)
      // console.log(`🔒 Fermeture du compte associé ${ata.toBase58()} pour le mint ${mint.toBase58()}...`);
      // tx.add(createCloseAccountInstruction(
      //   ata,           // Compte à fermer
      //   payer.publicKey, // Destination des SOLs résiduels (votre wallet)
      //   payer.publicKey  // Autorité de fermeture
      // ));

      // try {
      //   // Envoi de la transaction
      //   const signature = await sendAndConfirmTransaction(connection, tx, [payer]);
      //   console.log(`✅ Mint ${mint.toBase58()} traité. Tx: ${signature}`);
      // } catch (error) {
      //   if (error instanceof SendTransactionError) {
      //     console.log(`❌ Erreur lors de la fermeture du compte associé ${ata.toBase58()} pour le mint ${mint.toBase58()}:`, error);
      //     console.log('Logs:', error.transactionMessage);
      //   } else {
      //     console.log(`❌ Erreur inattendue lors de la fermeture du compte associé ${ata.toBase58()} pour le mint ${mint.toBase58()}:`, error);
      //   }
      // }



      // Remarque : Le mint (compte de mint) lui-même n'est pas fermé ici,
      // car SPL Token ne propose pas d'instruction standard pour fermer un compte de mint.
      // Si vous possédez la clé privée du mint, il faudra construire une instruction custom.
      // Fermeture du compte de metadonnées associé au mint
      const metadataPDA = await PublicKey.findProgramAddress(
        [
          Buffer.from('metadata'),
          METAPLEX_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
        ],
        METAPLEX_PROGRAM_ID
      );

      const metadataAccount = metadataPDA[0];
      // const closeMetadataIx = closeAccount({
      //   source: metadataAccount,
      //   destination: payer.publicKey,
      //   owner: payer.publicKey,
      // });
      // const tx = new web3.Transaction();
      const accounts = {
          metadata: metadataAccount,
          mint,
          mintAuthority: payer.publicKey,
          payer: payer.publicKey,
          updateAuthority: payer.publicKey,
      };
      const dataV2 = {
          name: "Test Token",
          symbol: "TEST",
          uri: "https://raw.githubusercontent.com/wasertech/test-token/refs/heads/main/metadata.json",
          // we don't need that
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null
      };
      const args =  {
        updateMetadataAccountArgsV2: {
            data: dataV2,
            isMutable: true,
            updateAuthority: payer.publicKey,
            primarySaleHappened: true
        }
      };
      const updateMetadataIx = createUpdateMetadataAccountV2Instruction(accounts, args);
      const updateMetadataTx = new Transaction().add(updateMetadataIx);
      try {
        const signature = await sendAndConfirmTransaction(connection, updateMetadataTx, [payer]);
        console.log(`✅ Compte de métadonnées ${metadataAccount.toBase58()} modifié. Tx: ${signature}`);
      } catch (error) {
        console.log(`❌ Erreur lors de la modification du compte de métadonnées ${metadataAccount.toBase58()}:`, error);
      }
    } catch (error) {
      console.log(`❌ Erreur pour le mint ${mint.toBase58()} :`, error);
    }
  }

  console.log("\n✨ Opération terminée. Seul le mint suivant reste actif :");
  // console.log(KEEP_MINT.toBase58());
}

// Exécution du script
burnAndCloseMints();
