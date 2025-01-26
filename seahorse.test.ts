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
  
    it("Initializes the mint", async () => {
      // vaultAccount = web3.Keypair.generate();
      mintAccount = web3.Keypair.generate();
      console.log(`MintAccount: ${mintAccount.publicKey}`);
  
      const txHash = await pg.program.methods
        .initializeTokenMint()
        .accounts({
          signer: pg.wallet.publicKey,
          mint: mintAccount.publicKey,
          decimals: 6,
        })
        .signers([pg.wallet.publicKey])
        .rpc();
      console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
  
      await pg.connection.confirmTransaction(txHash);
      // TODO: Fetch account et ajouter vos vérifications
    });
  
    //   it("Big Bang", async () => {
    //     const singularityKeypair = web3.Keypair.generate();
    //     const userEnergyKeypair = web3.Keypair.generate();
    //     const metabolizerKeypair = web3.Keypair.generate();
  
    //     const txHash = await pg.program.methods
    //       .bigBang(new anchor.BN(1000000), new anchor.BN(6), new anchor.BN(5), "test-pickle")
    //       .accounts({
    //         signer: provider.wallet.publicKey,
    //         signerAccount: userEnergyKeypair.publicKey,
    //         mint: mintAccount.publicKey,
    //         singularity: singularityKeypair.publicKey,
    //         singularityAccount: vaultAccount.publicKey,
    //         signerMetabolizer: metabolizerKeypair.publicKey,
    //         clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
    //       })
    //       .signers([singularityKeypair, userEnergyKeypair, metabolizerKeypair])
    //       .rpc();
    //     console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);
  
    //     await pg.connection.confirmTransaction(txHash);
    //     // TODO: Fetch singularity account et ajouter vos vérifications
    // });
  
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
  