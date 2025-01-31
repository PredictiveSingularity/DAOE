describe("Singularis", () => {
    // const provider = anchor.AnchorProvider.env();
    // anchor.setProvider(provider);
    // console.log(`Provider: ${provider}`);
  
    // const [energyMetabolizer] = web3.PublicKey.findProgramAddressSync(
    //   [Buffer.from("energy-metabolizer"), pg.wallet.publicKey.toBuffer()],
    //   pg.PROGRAM_ID
    // );
  
    // const program = anchor.workspace.Singularis as Program<Singularis>;
  
    // let vaultAccount: web3.Keypair;
    let mintAccount: web3.Keypair;
  
    // const programId = pg.program.programId;
  
    console.log(`Program ID: ${pg.PROGRAM_ID}`);
    console.log(`Wallet PubKey: ${pg.wallet.publicKey}`);
  
    // const INITIAL_FEE = new anchor.BN(5); // 5% fee
    // const PROGRAM_ID = programId.toBuffer();
    // const OPENAI_API_KEY = "test-api-key";
    // const ALLOWED_MODELS = ["model1", "model2"];
    // const AMOUNT_SOL = new anchor.BN(1000); // 1000 lamports (0.001 SOL)
  
    // it("Initializes the mint", async () => {
    //   // vaultAccount = web3.Keypair.generate();
    //   mintAccount = web3.Keypair.generate();
    //   console.log(`MintAccount: ${mintAccount.publicKey}`);
  
    //   const txHash = await pg.program.methods
    //     .initializeTokenMint(6)
    //     .accounts({
    //       // signer: pg.wallet.publicKey,
    //       mint: mintAccount.publicKey,
    //       // systemProgram: web3.SystemProgram.programId,
    //     })
    //     .signers([pg.wallet.publicKey])
    //     .rpc();
    //   console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
  
    //   await pg.connection.confirmTransaction(txHash);
    //   // TODO: Fetch account et ajouter vos vérifications
    // });

    it("Emergency", async () => {
      
      const mintAccount = 'dotMhX2cAK52Nqb3Xha3T91HJ1hkBbwNTcoaitepVJc' // web3.Keypair.generate();
      console.log(`MintAccount: ${mintAccount}`);
      const mintAccountPubKey = new web3.PublicKey(mintAccount)
      const vaultAccount = 'GdL6nnatszQNTH4xExt4rBw6bs5ZrR2irKn71SX6mcBY' // web3.Keypair.generate();
      console.log(`Singularity Account: ${vaultAccount}`);
      const vaultAccountPubKey = new web3.PublicKey(vaultAccount)
      const [singularity] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("0"), mintAccountPubKey.toBuffer()],
        pg.program.programId
      );
      console.log(`Singularity: ${singularity}`);
      
      // const userEnergyKeypair = '' // web3.Keypair.generate();
      // console.log(`UserEnergyAccount: ${userEnergyKeypair}`);
      // const metabolizerKeypair = '' // web3.Keypair.generate();
      // console.log(`Metabolizer: ${metabolizerKeypair}`);
  
      const signer = pg.wallet;
      console.log(`Signer: ${signer.publicKey}`);
  
      // const supply = new anchor.BN(1000000000000);
      // const decimals = 6; //new anchor.BN(6);
      const fee = 30; // new anchor.BN(30);
      const pickle = "789c6b60a99da20700056201c4"; // {}
  
      // console.log(`Supply: ${supply}`);
      // console.log(`Decimals: ${decimals}`);
      console.log(`Fee: ${fee}`);
      console.log(`Pickle: ${pickle}`);
  
      const txHash = await pg.program.methods
        .emerge(fee, pickle)
        .accounts({
          mint: mintAccountPubKey,
          // signerAccount: userEnergyKeypair,
          singularity: singularity,
          singularityAccount: vaultAccountPubKey,
          signer: signer.publicKey,
          // signerMetabolizer: metabolizerKeypair,
          // clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
          // rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          // systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([signer])
        .rpc();
      console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
  
      await pg.connection.confirmTransaction(txHash);
  
      // const mint = await pg.program.account.tokenMint(mintAccount.publicKey);
      // assert.ok(mint.owner.equals(pg.wallet.publicKey));
      // assert.ok(mint.supply.eq(new anchor.BN(0)));
    });
  
    // it("Initializes key provider accounts", async () => {
    //   keyProviderAccount = web3.Keypair.generate();
  
    //   await pg.program.rpc.initKeyProvider(OPENAI_API_KEY, ALLOWED_MODELS, {
    //     accounts: {
    //       provider: provider.wallet.publicKey,
    //       keyProviderAccount: keyProviderAccount.publicKey,
    //       systemProgram: web3.SystemProgram.programId,
    //     },
    //     signers: [keyProviderAccount],
    //   });
  
    //   const keyProvider = await program.account.keyProviderAccount(
    //     keyProviderAccount.publicKey
    //   );
    //   assert.ok(keyProvider.owner.equals(provider.wallet.publicKey));
    //   assert.ok(keyProvider.collateralVault.eq(new anchor.BN(0)));
    // });
  
    // it("Provisions energy for model requests", async () => {
    //   const maxCostSol = new anchor.BN(500); // 500 lamports (0.0005 SOL)
    //   const requestedModel = ALLOWED_MODELS[0];
  
    //   await pg.program.rpc.provisionEnergy(requestedModel, maxCostSol, {
    //     accounts: {
    //       user: provider.wallet.publicKey,
    //       userEnergyAccount: userEnergyAccount.publicKey,
    //       keyProviderAccount: keyProviderAccount.publicKey,
    //     },
    //   });
  
    //   const userEnergy = await pg.program.account.userEnergyAccount(
    //     userEnergyAccount.publicKey
    //   );
    //   const keyProvider = await pg.program.account.keyProviderAccount(
    //     keyProviderAccount.publicKey
    //   );
  
    //   const neededEnergy = maxCostSol.toNumber() * 1000;
    //   assert.ok(
    //     userEnergy.energyBalance.eq(
    //       new anchor.BN(expectedEnergyBalance - neededEnergy)
    //     )
    //   );
    //   assert.ok(keyProvider.collateralVault.eq(maxCostSol));
    // });
  
    // it("Consumes energy and pays the provider", async () => {
    //   lmGenerationTokenMint = web3.Keypair.generate();
    //   const actualCostSol = new anchor.BN(300); // 300 lamports (0.0003 SOL)
  
    //   await program.rpc.consumeEnergyAndPayProvider(actualCostSol, {
    //     accounts: {
    //       user: provider.wallet.publicKey,
    //       keyProviderAccount: keyProviderAccount.publicKey,
    //       userEnergyAccount: userEnergyAccount.publicKey,
    //       lmGenerationTokenMint: lmGenerationTokenMint.publicKey,
    //     },
    //   });
  
    //   const keyProvider = await pg.program.account.keyProviderAccount(
    //     keyProviderAccount.publicKey
    //   );
    //   assert.ok(keyProvider.collateralVault.eq(new anchor.BN(200))); // 500 - 300
    //   // Additional assertions for LM generation tokens can be added here
    // });
  });
  